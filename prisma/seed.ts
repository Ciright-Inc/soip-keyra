import { Prisma, PrismaClient } from "@prisma/client";
import { CORE_WIDGETS } from "../src/lib/widgets/registry";
import { NAMIBIA_SIMULATION, IRELAND_SIMULATION } from "../src/lib/simulation/countries";
import { computeGlobalMetrics } from "../src/lib/metrics/globalMetrics";

const prisma = new PrismaClient();

async function seedTerritoryTree() {
  const world = await prisma.sovereignNode.upsert({
    where: { code: "WORLD" },
    update: {},
    create: { code: "WORLD", name: "World", nodeType: "WORLD", operationalMode: "SIMULATION" },
  });

  const africa = await prisma.sovereignNode.upsert({
    where: { code: "CONT-AFRICA" },
    update: {},
    create: {
      code: "CONT-AFRICA",
      name: "Africa",
      nodeType: "CONTINENT",
      parentId: world.id,
      operationalMode: "SIMULATION",
    },
  });

  const europe = await prisma.sovereignNode.upsert({
    where: { code: "CONT-EUROPE" },
    update: {},
    create: {
      code: "CONT-EUROPE",
      name: "Europe",
      nodeType: "CONTINENT",
      parentId: world.id,
      operationalMode: "SIMULATION",
    },
  });

  const namibia = await prisma.sovereignNode.upsert({
    where: { code: "NA" },
    update: {},
    create: {
      code: "NA",
      name: "Namibia",
      nodeType: "COUNTRY",
      parentId: africa.id,
      isoAlpha2: "NA",
      operationalMode: "SIMULATION",
    },
  });

  const ireland = await prisma.sovereignNode.upsert({
    where: { code: "IE" },
    update: {},
    create: {
      code: "IE",
      name: "Ireland",
      nodeType: "COUNTRY",
      parentId: europe.id,
      isoAlpha2: "IE",
      operationalMode: "SIMULATION",
    },
  });

  return { world, africa, europe, namibia, ireland };
}

async function seedCountrySimulations(nodes: { namibia: { id: string }; ireland: { id: string } }) {
  const naJson = {
    demographics: NAMIBIA_SIMULATION.demographics as Prisma.InputJsonValue,
    workforce: NAMIBIA_SIMULATION.workforce as Prisma.InputJsonValue,
    telecom: NAMIBIA_SIMULATION.telecom as Prisma.InputJsonValue,
    banking: NAMIBIA_SIMULATION.banking as Prisma.InputJsonValue,
    government: NAMIBIA_SIMULATION.government as Prisma.InputJsonValue,
    economy: NAMIBIA_SIMULATION.economy as Prisma.InputJsonValue,
    humanMovement: NAMIBIA_SIMULATION.humanMovement as Prisma.InputJsonValue,
  };

  await prisma.countrySimulation.upsert({
    where: { isoAlpha2: "NA" },
    update: {
      population: BigInt(NAMIBIA_SIMULATION.population),
      ...naJson,
      simulationQuality: NAMIBIA_SIMULATION.simulationQuality,
    },
    create: {
      sovereignNodeId: nodes.namibia.id,
      isoAlpha2: "NA",
      population: BigInt(NAMIBIA_SIMULATION.population),
      ...naJson,
      simulationQuality: NAMIBIA_SIMULATION.simulationQuality,
    },
  });

  const ieJson = {
    demographics: IRELAND_SIMULATION.demographics as Prisma.InputJsonValue,
    workforce: IRELAND_SIMULATION.workforce as Prisma.InputJsonValue,
    telecom: IRELAND_SIMULATION.telecom as Prisma.InputJsonValue,
    banking: IRELAND_SIMULATION.banking as Prisma.InputJsonValue,
    government: IRELAND_SIMULATION.government as Prisma.InputJsonValue,
    economy: IRELAND_SIMULATION.economy as Prisma.InputJsonValue,
    humanMovement: IRELAND_SIMULATION.humanMovement as Prisma.InputJsonValue,
  };

  await prisma.countrySimulation.upsert({
    where: { isoAlpha2: "IE" },
    update: {
      population: BigInt(IRELAND_SIMULATION.population),
      ...ieJson,
      simulationQuality: IRELAND_SIMULATION.simulationQuality,
    },
    create: {
      sovereignNodeId: nodes.ireland.id,
      isoAlpha2: "IE",
      population: BigInt(IRELAND_SIMULATION.population),
      ...ieJson,
      simulationQuality: IRELAND_SIMULATION.simulationQuality,
    },
  });
}

async function seedWidgets() {
  for (let i = 0; i < CORE_WIDGETS.length; i++) {
    const w = CORE_WIDGETS[i];
    await prisma.soipWidget.upsert({
      where: { widgetKey: w.key },
      update: { title: w.title, description: w.description, sortOrder: i },
      create: {
        widgetKey: w.key,
        title: w.title,
        description: w.description,
        sortOrder: i,
        agentConfig: { signal: w.signal, category: w.category },
      },
    });
  }
}

async function seedRegulatory(nodes: { namibia: { id: string }; ireland: { id: string } }) {
  const treaties = [
    { nodeId: nodes.namibia.id, code: "UN", name: "United Nations Membership", status: "JOINED" as const },
    { nodeId: nodes.namibia.id, code: "AU", name: "African Union", status: "JOINED" as const },
    { nodeId: nodes.ireland.id, code: "EU", name: "European Union", status: "JOINED" as const },
    { nodeId: nodes.ireland.id, code: "EUDR", name: "EU Deforestation Regulation", status: "ENFORCING" as const },
    { nodeId: nodes.ireland.id, code: "GDPR", name: "General Data Protection Regulation", status: "ENFORCING" as const },
  ];

  for (const t of treaties) {
    await prisma.regulatoryTreaty.upsert({
      where: { sovereignNodeId_treatyCode: { sovereignNodeId: t.nodeId, treatyCode: t.code } },
      update: { treatyName: t.name, status: t.status },
      create: {
        sovereignNodeId: t.nodeId,
        treatyCode: t.code,
        treatyName: t.name,
        status: t.status,
        authority: t.code === "GDPR" ? "DPC Ireland" : undefined,
      },
    });
  }
}

async function seedGlobalMetrics() {
  const m = computeGlobalMetrics("SIMULATION");
  await prisma.globalMetricSnapshot.create({
    data: {
      worldHumanPopulation: BigInt(m.worldHumanPopulation),
      authenticatedHumans: BigInt(m.authenticatedHumans),
      trustedHumanRelationships: BigInt(m.trustedHumanRelationships),
      authenticatedAiAgents: BigInt(m.authenticatedAiAgents),
      humanLinkedAiAgents: BigInt(m.humanLinkedAiAgents),
      authenticatedAndroids: BigInt(m.authenticatedAndroids),
      authenticatedThings: BigInt(m.authenticatedThings),
      trustTps: m.trustTps,
      operationalSovereignNodes: m.operationalSovereignNodes,
      activeSecureSessions: BigInt(m.activeSecureSessions),
      operationalMode: "SIMULATION",
    },
  });
}

async function main() {
  console.info("[soip seed] Starting SOIP intelligence layer seed…");
  const nodes = await seedTerritoryTree();
  await seedCountrySimulations(nodes);
  await seedWidgets();
  await seedRegulatory(nodes);
  await seedGlobalMetrics();
  console.info("[soip seed] Complete — Namibia, Ireland, widgets, treaties, metrics.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

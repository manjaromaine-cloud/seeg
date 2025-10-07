import { Incident, IncidentStatus, ServiceType } from '@/types/incident';

export const generateMockIncidents = (count: number): Incident[] => {
  const incidents: Incident[] = [];
  const statuses: IncidentStatus[] = ["scheduled", "ongoing", "resolved", "reported"];
  const serviceTypes: ServiceType[] = ["water", "electricity"];
  const sectorNames = ["Centre Ville", "Nzeng Ayong", "Owendo", "Louis", "Glass"];

  for (let i = 0; i < count; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const service_type = serviceTypes[Math.floor(Math.random() * serviceTypes.length)];
    const sector = sectorNames[Math.floor(Math.random() * sectorNames.length)];

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 10) - 5); // +/- 5 days from today
    const endDate = new Date(startDate);
    endDate.setHours(startDate.getHours() + Math.floor(Math.random() * 24) + 1); // 1-24 hours duration

    incidents.push({
      id: `inc-${i + 1}`,
      title: `Incident ${i + 1} - ${service_type === "water" ? "Coupure d'eau" : "Coupure d'électricité"}`,
      description: `Description détaillée de l'incident ${i + 1} dans le secteur ${sector}.`,
      service_type,
      status,
      start_time: startDate.toISOString(),
      expected_end_time: status === "resolved" ? startDate.toISOString() : endDate.toISOString(),
      sector_id: `sec-${sector.replace(/\s/g, '').toLowerCase()}`,
      latitude: 0.4162 + (Math.random() - 0.5) * 0.1, // Simulate around Libreville
      longitude: 9.4527 + (Math.random() - 0.5) * 0.1, // Simulate around Libreville
      sectors: { name: sector },
    });
  }

  return incidents;
};

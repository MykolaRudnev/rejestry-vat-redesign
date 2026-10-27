import type { Company } from "@/lib/types";

/** Client companies served by the accounting office (demo data). */
export const companies: Company[] = [
  { id: "nordwind", name: "Nordwind Software Sp. z o.o.", shortName: "Nordwind Software", nip: "5842799130", city: "Gdańsk", vatScheme: "V7M" },
  { id: "klos", name: "Piekarnia Kłos s.c.", shortName: "Piekarnia Kłos", nip: "9462681246", city: "Lublin", vatScheme: "V7M" },
  { id: "ogrod", name: "Zielony Ogród Anna Wójcik", shortName: "Zielony Ogród", nip: "6762412342", city: "Kraków", vatScheme: "V7K" },
  { id: "medica", name: "Medica Plus Sp. z o.o.", shortName: "Medica Plus", nip: "7792451838", city: "Poznań", vatScheme: "V7M" },
];

export const TODAY = "2026-10-26";

const header = 'timestamp,power_kW\n';
export const EXAMPLES: Record<string, { title: string; text: string }> = {
  'correct-15min': { title: 'Serie correcta · 15 minutos', text: header + '2024-01-01T00:00:00Z,2\n2024-01-01T00:15:00Z,2\n2024-01-01T00:30:00Z,2\n2024-01-01T00:45:00Z,2\n2024-01-01T01:00:00Z,2\n' },
  duplicate: { title: 'Timestamp duplicado', text: header + '2024-01-01T00:00:00Z,2\n2024-01-01T00:15:00Z,2\n2024-01-01T00:15:00Z,3\n2024-01-01T00:30:00Z,2\n' },
  gap: { title: 'Un hueco en la serie', text: header + '2024-01-01T00:00:00Z,2\n2024-01-01T00:15:00Z,2\n2024-01-01T00:45:00Z,2\n2024-01-01T01:00:00Z,2\n' },
  unordered: { title: 'Registros fuera de orden', text: header + '2024-01-01T00:15:00Z,2\n2024-01-01T00:00:00Z,2\n2024-01-01T00:30:00Z,2\n' },
  'dst-spring': { title: 'Madrid · salto de primavera', text: header + '2024-03-31T01:30:00+01:00,2\n2024-03-31T01:45:00+01:00,2\n2024-03-31T03:00:00+02:00,2\n2024-03-31T03:15:00+02:00,2\n' },
  'dst-autumn': { title: 'Madrid · hora repetida de otoño', text: header + '2024-10-27T02:30:00+02:00,2\n2024-10-27T02:45:00+02:00,2\n2024-10-27T02:00:00+01:00,2\n2024-10-27T02:15:00+01:00,2\n' },
  'counter-reset': { title: 'Contador con reinicio', text: 'timestamp,counter_kWh\n2024-01-01T00:00:00Z,100\n2024-01-01T00:15:00Z,102\n2024-01-01T00:30:00Z,1\n2024-01-01T00:45:00Z,3\n' },
  'decimal-comma': { title: 'Punto y coma · decimal con coma', text: 'timestamp;power_kW\n2024-01-01T00:00:00Z;1,5\n2024-01-01T00:15:00Z;1,5\n2024-01-01T00:30:00Z;1,5\n' },
  export: { title: 'Potencia negativa · exportación', text: header + '2024-01-01T00:00:00Z,-2\n2024-01-01T00:15:00Z,-2\n2024-01-01T00:30:00Z,-2\n' },
  'unit-shift': { title: 'Posible cambio de kW a W', text: header + '2024-01-01T00:00:00Z,2\n2024-01-01T00:15:00Z,2\n2024-01-01T00:30:00Z,2000\n2024-01-01T00:45:00Z,2000\n' },
};

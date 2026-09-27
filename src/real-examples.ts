import industrial from '../examples/real/consumo-industrial.csv?raw';
import solar from '../examples/real/solar-industrial.csv?raw';
import battery from '../examples/real/bateria-inicio-registro.csv?raw';
import school from '../examples/real/consumo-escuela.csv?raw';

export const REAL_EXAMPLES: Record<string, { title: string; text: string; task: string }> = {
  'consumo-industrial': { title: 'Real · Consumo industrial', text: industrial, task: 'Comprueba la presencia de 744 registros horarios. Los valores son acumulados, no consumos de cada hora.' },
  'solar-industrial': { title: 'Real · Generación solar', text: solar, task: 'Revisa las lecturas sin incremento: pueden corresponder a la noche. El periodo atraviesa el cambio horario de marzo, usando UTC.' },
  'bateria-inicio-registro': { title: 'Real · Batería con valores ausentes', text: battery, task: 'Compara fechas presentes y valores utilizables: hay 192 registros y 39 valores ausentes al comienzo.' },
  'consumo-escuela': { title: 'Real · Consumo de escuela', text: school, task: 'Revisa un patrón de consumo distinto con 720 registros horarios.' },
};

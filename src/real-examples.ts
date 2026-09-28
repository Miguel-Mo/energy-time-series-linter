import industrial from '../examples/real/consumo-industrial.csv?raw';
import solar from '../examples/real/solar-industrial.csv?raw';
import battery from '../examples/real/bateria-inicio-registro.csv?raw';
import school from '../examples/real/consumo-escuela.csv?raw';
import uci from '../examples/uci/household-2006-12-17.csv?raw';

export const REAL_EXAMPLES: Record<string, { title: string; text: string; task: string }> = {
  'uci-household': { title: 'Real · UCI · Fecha y hora separadas', text: uci, task: '1440 medias de potencia de un minuto. Fecha día/mes/año, hora separada, kW y decimal punto. Europe/Paris se propone por la ubicación; la fuente no declara la zona. Inicio de intervalo es una hipótesis de esta prueba: la fuente no especifica la posición. Energía de referencia: 56,5077 kWh.' },
  'consumo-industrial': { title: 'Real · Consumo industrial', text: industrial, task: 'Comprueba la presencia de 744 registros horarios. Los valores son acumulados, no consumos de cada hora.' },
  'solar-industrial': { title: 'Real · Generación solar', text: solar, task: 'Revisa las lecturas sin incremento: pueden corresponder a la noche. El periodo atraviesa el cambio horario de marzo, usando UTC.' },
  'bateria-inicio-registro': { title: 'Real · Batería con valores ausentes', text: battery, task: 'Compara fechas presentes y valores utilizables: hay 192 registros y 39 valores ausentes al comienzo.' },
  'consumo-escuela': { title: 'Real · Consumo de escuela', text: school, task: 'Revisa un patrón de consumo distinto con 720 registros horarios.' },
};

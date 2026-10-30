// Contenido de DEMO. Todo está escrito desde cero para este repositorio y es de libre uso.
// Para usar la app con tu propio temario, sustituye este fichero respetando la misma forma.
//
// Tipos de pregunta:
//   mc    → opción única: opts[], a (índice de la correcta). Opcional: code (bloque de código), codeOpts (opciones en monoespaciada)
//   order → ordenar: items[] en el ORDEN CORRECTO (la app los baraja)
//   num   → respuesta numérica: answer (número), unit opcional
//   xml   → escribir XML bien formado: reqs[{txt, chk}], starter, solution (ver app.js · checkXML)
// ref = id del apartado de los apuntes (APC) donde está la respuesta; ap = id en el esquema (RESUMEN) si es distinto.

const APP = {
  titulo: 'Repaso DAW',
  eyebrow: 'Demo · contenido público',
  intro: 'Tests con repaso espaciado y apuntes buscables. Esta demo trae dos módulos de ejemplo: Java e Historia contemporánea.',
  pie: 'Contenido de demostración escrito para este repositorio.',
};

const MODULOS = [
  { id: 'JAVA', nombre: 'Programación en Java', color: 'm1' },
  { id: 'HIS',  nombre: 'Historia contemporánea', color: 'm4' },
];

const TEMAS = {
  JAVA: { 1: 'Fundamentos de Java', 2: 'Control de flujo' },
  HIS:  { 1: 'La Revolución Industrial', 2: 'La Revolución Francesa' },
};

// ═════════════════════════ PREGUNTAS ═════════════════════════
const PREGUNTAS = [
// ───────── JAVA · Tema 1 ─────────
{ id:'JAVA1-01', m:'JAVA', t:1, type:'mc', ref:'1', q:'¿Qué genera el compilador javac a partir de un fichero .java?',
  opts:['Bytecode en un fichero .class','Código máquina nativo .exe','Un fichero .jar ejecutable directamente por el procesador','Código fuente optimizado .java'], a:0,
  exp:'javac traduce el código fuente a bytecode (.class). Ese bytecode lo ejecuta la JVM, por eso el mismo .class funciona en Windows, macOS o Linux.' },
{ id:'JAVA1-02', m:'JAVA', t:1, type:'mc', ref:'1', q:'¿Qué componente ejecuta el bytecode?',
  opts:['La JVM (Java Virtual Machine)','El JDK','javac','El sistema operativo directamente'], a:0,
  exp:'La JVM interpreta (y compila al vuelo con JIT) el bytecode. El JDK es el kit de desarrollo, que incluye javac y la propia JVM.' },
{ id:'JAVA1-03', m:'JAVA', t:1, type:'mc', ref:'2', q:'¿Cuál es la firma correcta del método de arranque de un programa Java?',
  opts:['public static void main(String[] args)','public void main()','static int main(String args)','void start(String[] args)'], a:0, codeOpts:true,
  exp:'La JVM busca un método public static void main que reciba un array de String.' },
{ id:'JAVA1-04', m:'JAVA', t:1, type:'mc', ref:'3', q:'¿Cuántos bits ocupa un int en Java?',
  opts:['32','16','64','Depende del sistema operativo'], a:0,
  exp:'En Java el tamaño de los primitivos es fijo en cualquier plataforma: int ocupa 32 bits.' },
{ id:'JAVA1-05', m:'JAVA', t:1, type:'mc', ref:'3', q:'¿Cuál de estos NO es un tipo primitivo?',
  opts:['String','char','boolean','double'], a:0,
  exp:'String es una clase (un tipo por referencia). Los 8 primitivos son byte, short, int, long, float, double, char y boolean.' },
{ id:'JAVA1-06', m:'JAVA', t:1, type:'num', ref:'4', q:'¿Qué valor guarda r?', code:'int r = 17 / 5;', answer:3,
  exp:'Entre dos int la división es entera: se descarta la parte decimal (3,4 → 3).' },
{ id:'JAVA1-07', m:'JAVA', t:1, type:'num', ref:'4', q:'¿Qué valor guarda r?', code:'int r = 17 % 5;', answer:2,
  exp:'% es el resto de la división entera: 17 = 5 · 3 + 2.' },
{ id:'JAVA1-08', m:'JAVA', t:1, type:'num', ref:'4', q:'¿Qué valor tiene y al final?', code:'int x = 5;\nint y = x++ + 2;', answer:7,
  exp:'x++ es postincremento: primero se usa el valor (5) y después se incrementa. y = 5 + 2 = 7, y x acaba valiendo 6.' },
{ id:'JAVA1-09', m:'JAVA', t:1, type:'mc', ref:'4', q:'¿Qué imprime este código?', code:'int a = 0;\nif (a != 0 && 10 / a > 1) System.out.println("sí");\nelse System.out.println("no");',
  opts:['no','sí','Lanza ArithmeticException (división entre cero)','No compila'], a:0,
  exp:'&& es de cortocircuito: como a != 0 es false, la segunda parte (10 / a) no llega a evaluarse.' },
{ id:'JAVA1-10', m:'JAVA', t:1, type:'num', ref:'5', q:'¿Qué valor guarda n?', code:'int n = (int) 9.99;', answer:9,
  exp:'El casting de double a int trunca: corta los decimales, no redondea.' },
{ id:'JAVA1-11', m:'JAVA', t:1, type:'mc', ref:'5', q:'¿Cuál de estas asignaciones necesita casting explícito?',
  opts:['int i = 3.5;','double d = 7;','long l = 10;','float f = 2;'], a:0, codeOpts:true,
  exp:'Pasar de double a int pierde información, así que Java obliga a escribir (int). Las otras son conversiones de ensanchamiento, que son automáticas.' },
{ id:'JAVA1-12', m:'JAVA', t:1, type:'mc', ref:'6', q:'¿Qué hace la palabra final en una variable?',
  opts:['Impide reasignarla una vez tiene valor','La hace global para todo el programa','La borra al terminar el método','La convierte en String'], a:0,
  exp:'Una variable final solo se asigna una vez: es la forma de declarar constantes (por convención en MAYÚSCULAS, p. ej. IVA_GENERAL).' },
{ id:'JAVA1-13', m:'JAVA', t:1, type:'order', ref:'1', q:'Ordena los pasos desde que escribes el código hasta que se ejecuta.',
  items:['Escribir Hola.java','Compilar con javac','Se genera Hola.class (bytecode)','La JVM ejecuta el bytecode'],
  exp:'Fuente → javac → bytecode → JVM. Ese paso intermedio es lo que hace portable a Java.' },

// ───────── JAVA · Tema 2 ─────────
{ id:'JAVA2-01', m:'JAVA', t:2, type:'mc', ref:'1', q:'¿Qué imprime este código?', code:'int nota = 7;\nif (nota >= 9) System.out.println("Sobresaliente");\nelse if (nota >= 5) System.out.println("Aprobado");\nelse System.out.println("Suspenso");',
  opts:['Aprobado','Sobresaliente','Suspenso','Aprobado y Suspenso'], a:0,
  exp:'Las ramas else if se evalúan en orden y solo se ejecuta la primera que se cumple.' },
{ id:'JAVA2-02', m:'JAVA', t:2, type:'mc', ref:'2', q:'En un switch clásico (con dos puntos), ¿qué pasa si un case no tiene break?',
  opts:['Sigue ejecutando el código de los case siguientes','Da error de compilación','Salta directamente al default','Termina el programa'], a:0,
  exp:'Es el "fall-through": la ejecución cae al siguiente case hasta encontrar un break o el final del switch.' },
{ id:'JAVA2-03', m:'JAVA', t:2, type:'mc', ref:'3', q:'¿Qué diferencia a do-while de while?',
  opts:['do-while ejecuta el cuerpo al menos una vez','do-while no admite condiciones compuestas','while siempre se ejecuta al menos una vez','No hay diferencia'], a:0,
  exp:'do-while comprueba la condición al final, así que el cuerpo se ejecuta como mínimo una vez. Útil para menús.' },
{ id:'JAVA2-04', m:'JAVA', t:2, type:'num', ref:'4', q:'¿Cuántas veces se ejecuta el cuerpo del bucle?', code:'for (int i = 0; i < 10; i += 3) {\n  System.out.println(i);\n}', answer:4,
  exp:'i toma 0, 3, 6 y 9. Con 12 la condición i < 10 ya es falsa: 4 vueltas.' },
{ id:'JAVA2-05', m:'JAVA', t:2, type:'num', ref:'3', q:'¿Qué valor tiene suma al terminar?', code:'int suma = 0, i = 1;\nwhile (i <= 4) {\n  suma += i;\n  i++;\n}', answer:10,
  exp:'1 + 2 + 3 + 4 = 10.' },
{ id:'JAVA2-06', m:'JAVA', t:2, type:'order', ref:'4', q:'Ordena cómo se ejecuta un bucle for en su primera vuelta.',
  items:['Inicialización (int i = 0)','Comprobar la condición (i < n)','Ejecutar el cuerpo','Actualización (i++)'],
  exp:'La inicialización ocurre una sola vez. Después se repite: condición → cuerpo → actualización.' },
{ id:'JAVA2-07', m:'JAVA', t:2, type:'mc', ref:'5', q:'¿Qué hace continue dentro de un bucle?',
  opts:['Salta al final de la vuelta actual y pasa a la siguiente','Sale del bucle por completo','Reinicia el bucle desde cero','Pausa el programa'], a:0,
  exp:'continue salta el resto de la vuelta actual; break, en cambio, sale del bucle.' },
{ id:'JAVA2-08', m:'JAVA', t:2, type:'num', ref:'5', q:'¿Cuántas líneas imprime?', code:'for (int i = 1; i <= 10; i++) {\n  if (i % 2 == 0) continue;\n  if (i > 7) break;\n  System.out.println(i);\n}', answer:4,
  exp:'Imprime 1, 3, 5 y 7. Los pares se saltan con continue y al llegar a 9 se ejecuta el break.' },
{ id:'JAVA2-09', m:'JAVA', t:2, type:'mc', ref:'6', q:'¿Qué valor toma msg?', code:'int edad = 16;\nString msg = edad >= 18 ? "adulto" : "menor";',
  opts:['"menor"','"adulto"','true','No compila'], a:0,
  exp:'El ternario es condición ? valorSiTrue : valorSiFalse. 16 >= 18 es falso, así que msg vale "menor".' },
{ id:'JAVA2-10', m:'JAVA', t:2, type:'mc', ref:'4', q:'¿Para qué sirve el for-each (for (int n : numeros))?',
  opts:['Recorrer todos los elementos de un array o colección sin manejar índices','Repetir un bloque un número aleatorio de veces','Crear un array nuevo','Ordenar un array'], a:0,
  exp:'El for mejorado recorre cada elemento de principio a fin. Si necesitas el índice o modificar posiciones, usa el for clásico.' },
{ id:'JAVA2-11', m:'JAVA', t:2, type:'mc', ref:'2', q:'¿Qué tipos admite la expresión de un switch en Java moderno?',
  opts:['int (y tipos menores), char, String y enum, entre otros','Solo int','Solo boolean','double y float'], a:0,
  exp:'Desde Java 7 se puede usar String. double, float y boolean no están permitidos.' },

// ───────── HISTORIA · Tema 1 ─────────
{ id:'HIS1-01', m:'HIS', t:1, type:'mc', ref:'1', q:'¿En qué país empezó la Revolución Industrial?',
  opts:['Gran Bretaña','Francia','Alemania','Estados Unidos'], a:0,
  exp:'Empezó en Gran Bretaña en la segunda mitad del siglo XVIII y desde allí se extendió a Bélgica, Francia, Alemania y Estados Unidos.' },
{ id:'HIS1-02', m:'HIS', t:1, type:'mc', ref:'2', q:'¿Qué fueron los cercamientos (enclosures)?',
  opts:['El vallado de tierras comunales para formar explotaciones privadas','Murallas para defender las fábricas','Las primeras leyes contra el trabajo infantil','Barrios obreros cerrados'], a:0,
  exp:'Formaron parte de la revolución agrícola: aumentaron la productividad y empujaron a muchos campesinos a emigrar a las ciudades, donde fueron mano de obra para las fábricas.' },
{ id:'HIS1-03', m:'HIS', t:1, type:'mc', ref:'3', q:'¿A quién se asocia la mejora decisiva de la máquina de vapor?',
  opts:['James Watt','George Stephenson','Thomas Edison','Henry Ford'], a:0,
  exp:'Watt patentó en 1769 un condensador separado que hizo la máquina de vapor mucho más eficiente. Stephenson es el de la locomotora.' },
{ id:'HIS1-04', m:'HIS', t:1, type:'mc', ref:'3', q:'¿Qué sector fue el primero en mecanizarse?',
  opts:['El textil del algodón','La siderurgia','La química','La automoción'], a:0,
  exp:'Lanzadera volante, spinning jenny y water frame mecanizaron el hilado y el tejido del algodón antes que cualquier otra industria.' },
{ id:'HIS1-05', m:'HIS', t:1, type:'order', ref:'3', q:'Ordena estos inventos de más antiguo a más reciente.',
  items:['Lanzadera volante (Kay, 1733)','Spinning jenny (Hargreaves, c. 1764)','Máquina de vapor de Watt (1769)','Locomotora Rocket (Stephenson, 1829)'],
  exp:'Primero el textil, luego la energía y por último el transporte.' },
{ id:'HIS1-06', m:'HIS', t:1, type:'num', ref:'3', q:'¿En qué año se inauguró la línea de ferrocarril Liverpool–Manchester, la primera de pasajeros con horarios regulares y locomotoras de vapor?', answer:1830,
  exp:'1830. En 1825 se había abierto la Stockton–Darlington, pero era sobre todo para carga.' },
{ id:'HIS1-07', m:'HIS', t:1, type:'mc', ref:'4', q:'¿Qué dos clases sociales nuevas definen la sociedad industrial?',
  opts:['Burguesía industrial y proletariado','Nobleza y clero','Campesinos y artesanos','Funcionarios y militares'], a:0,
  exp:'La burguesía era la dueña de los medios de producción y el proletariado vendía su fuerza de trabajo a cambio de un salario.' },
{ id:'HIS1-08', m:'HIS', t:1, type:'mc', ref:'5', q:'¿Qué fue el ludismo?',
  opts:['Un movimiento obrero que destruía máquinas','Una teoría económica liberal','Un tipo de telar','Una ley de protección de la infancia'], a:0,
  exp:'Hacia 1811-1816 algunos obreros ingleses rompían las máquinas porque las culpaban del paro y de la bajada de salarios.' },
{ id:'HIS1-09', m:'HIS', t:1, type:'num', ref:'5', q:'¿En qué año publicaron Marx y Engels el Manifiesto Comunista?', answer:1848,
  exp:'1848, el mismo año de las revoluciones liberales que recorrieron Europa.' },
{ id:'HIS1-10', m:'HIS', t:1, type:'mc', ref:'6', q:'¿Qué fuentes de energía caracterizan la Segunda Revolución Industrial?',
  opts:['Electricidad y petróleo','Carbón y vapor','Viento y agua','Energía nuclear y solar'], a:0,
  exp:'Desde 1870 aproximadamente, la electricidad y el petróleo (con el motor de combustión) se suman al carbón y al vapor.' },
{ id:'HIS1-11', m:'HIS', t:1, type:'mc', ref:'6', q:'¿Qué innovación de organización del trabajo introdujo Ford en 1913?',
  opts:['La cadena de montaje','El trabajo a domicilio','Los gremios','El taller artesanal'], a:0,
  exp:'Con la cadena de montaje cada obrero hace una tarea repetitiva mientras el producto avanza. Abarató el Ford T.' },

// ───────── HISTORIA · Tema 2 ─────────
{ id:'HIS2-01', m:'HIS', t:2, type:'mc', ref:'1', q:'¿Qué grupo pagaba la mayor parte de los impuestos en el Antiguo Régimen francés?',
  opts:['El Tercer Estado','La nobleza','El clero','El rey'], a:0,
  exp:'Clero y nobleza eran estamentos privilegiados y estaban casi exentos. El Tercer Estado (burguesía, campesinos, artesanos) cargaba con los impuestos.' },
{ id:'HIS2-02', m:'HIS', t:2, type:'mc', ref:'1', q:'¿Qué pensador ilustrado defendió la separación de poderes?',
  opts:['Montesquieu','Rousseau','Voltaire','Diderot'], a:0,
  exp:'Montesquieu, en El espíritu de las leyes (1748): legislativo, ejecutivo y judicial en manos distintas. Rousseau es el del contrato social y la soberanía popular.' },
{ id:'HIS2-03', m:'HIS', t:2, type:'num', ref:'3', q:'¿En qué año fue la toma de la Bastilla?', answer:1789,
  exp:'El 14 de julio de 1789. Hoy es la fiesta nacional de Francia.' },
{ id:'HIS2-04', m:'HIS', t:2, type:'order', ref:'3', q:'Ordena los acontecimientos de 1789.',
  items:['Reunión de los Estados Generales (mayo)','Juramento del Juego de Pelota (junio)','Toma de la Bastilla (14 de julio)','Declaración de los Derechos del Hombre y del Ciudadano (agosto)'],
  exp:'En pocos meses se pasa de una asamblea convocada por el rey a una declaración de derechos que rompe con el Antiguo Régimen.' },
{ id:'HIS2-05', m:'HIS', t:2, type:'mc', ref:'3', q:'¿Qué juraron los diputados del Tercer Estado en el Juego de Pelota?',
  opts:['No separarse hasta dar una Constitución a Francia','Obedecer al rey en todo','Declarar la guerra a Austria','Restaurar los privilegios'], a:0,
  exp:'Se habían proclamado Asamblea Nacional y juraron mantenerse unidos hasta redactar una Constitución.' },
{ id:'HIS2-06', m:'HIS', t:2, type:'mc', ref:'4', q:'¿Qué régimen estableció la Constitución de 1791?',
  opts:['Una monarquía constitucional','Una república','Una monarquía absoluta','Un imperio'], a:0,
  exp:'El rey seguía en el trono, pero con poderes limitados y separación de poderes. El sufragio era censitario.' },
{ id:'HIS2-07', m:'HIS', t:2, type:'mc', ref:'4', q:'¿Qué fue la huida a Varennes (1791)?',
  opts:['El intento fallido de Luis XVI de escapar de Francia','La retirada del ejército prusiano','El exilio de Robespierre','La salida de Napoleón hacia Egipto'], a:0,
  exp:'El rey y su familia fueron reconocidos y detenidos en Varennes. Hundió la confianza en la monarquía.' },
{ id:'HIS2-08', m:'HIS', t:2, type:'num', ref:'5', q:'¿En qué año fue ejecutado Luis XVI?', answer:1793,
  exp:'Fue guillotinado el 21 de enero de 1793, meses después de proclamarse la República (septiembre de 1792).' },
{ id:'HIS2-09', m:'HIS', t:2, type:'mc', ref:'5', q:'¿Qué grupo dirigió la etapa del Terror?',
  opts:['Los jacobinos, con Robespierre','Los girondinos','Los monárquicos','El Directorio'], a:0,
  exp:'Desde el Comité de Salvación Pública (1793-1794). Terminó con la caída y ejecución de Robespierre en julio de 1794 (Termidor).' },
{ id:'HIS2-10', m:'HIS', t:2, type:'mc', ref:'6', q:'¿Cómo llegó Napoleón al poder en 1799?',
  opts:['Con un golpe de Estado (18 de brumario)','Ganando unas elecciones','Por herencia','Elegido por la Convención'], a:0,
  exp:'El golpe del 18 de brumario (9 de noviembre de 1799) acabó con el Directorio e instauró el Consulado.' },
{ id:'HIS2-11', m:'HIS', t:2, type:'order', ref:'6', q:'Ordena estas etapas de más antigua a más reciente.',
  items:['Monarquía constitucional','Convención y Terror','Directorio','Consulado','Imperio napoleónico'],
  exp:'1791 → 1792-1795 → 1795-1799 → 1799-1804 → 1804-1814/15.' },
];

// ═════════════════════════ APUNTES (vista completa) ═════════════════════════
// p: strings (markdown simple **negrita**; dos espacios delante = sub-punto), {code:'...'} o {tb:[[cabecera...],[fila...]]}
const APC = {
JAVA: {
1: [
 { id:'1', t:'Qué es Java y cómo se ejecuta', p:[
  'Lenguaje **orientado a objetos**, de tipado **estático** y **multiplataforma**.',
  'Flujo: código fuente **.java** → compilador **javac** → **bytecode** (.class) → lo ejecuta la **JVM**.',
  'Lema: *write once, run anywhere*. El bytecode es el mismo en cualquier sistema; lo que cambia es la JVM.',
  { tb:[['Pieza','Qué es'],['JVM','Máquina virtual que ejecuta bytecode'],['JRE','JVM + librerías estándar (para ejecutar)'],['JDK','JRE + herramientas de desarrollo como javac (para programar)']] } ]},
 { id:'2', t:'Estructura de un programa', p:[
  'Todo el código va dentro de una **clase**. El fichero se llama igual que la clase pública.',
  'El programa arranca en **public static void main(String[] args)**.',
  { code:'public class Hola {\n  public static void main(String[] args) {\n    System.out.println("Hola, mundo");\n  }\n}' },
  'Cada sentencia acaba en **;**. Los bloques van entre **{ }**.',
  'Comentarios: **//** una línea, **/* ... */** varias líneas y **/** ... */** Javadoc.' ]},
 { id:'3', t:'Variables y tipos primitivos', p:[
  'Una variable se declara con **tipo + nombre**: int edad = 20;',
  { tb:[['Tipo','Tamaño','Ejemplo'],['byte','8 bits','byte b = 100;'],['short','16 bits','short s = 3000;'],['int','32 bits','int n = 42;'],['long','64 bits','long l = 9000000000L;'],['float','32 bits','float f = 3.5f;'],['double','64 bits','double d = 3.5;'],['char','16 bits','char c = \'A\';'],['boolean','true/false','boolean ok = true;']] },
  '**String** no es primitivo: es una **clase** (tipo por referencia).',
  'El tamaño de los primitivos es **fijo** en cualquier plataforma.' ]},
 { id:'4', t:'Operadores', p:[
  '**Aritméticos**: + - * / y **%** (resto).',
  '  Entre dos int, / hace **división entera**: 17 / 5 = 3.',
  '**Incremento**: ++x (pre: suma y luego usa) y x++ (post: usa y luego suma).',
  '**Relacionales**: == != < > <= >= (devuelven boolean).',
  '**Lógicos**: && (y), || (o), ! (no). && y || son de **cortocircuito**: si con la primera parte ya se sabe el resultado, no evalúan la segunda.',
  'Compuestos: += -= *= /= %=.' ]},
 { id:'5', t:'Conversión de tipos (casting)', p:[
  '**Implícita** (ensanchamiento): de un tipo pequeño a uno mayor, sin perder datos. int → long → float → double.',
  '**Explícita** (casting): de mayor a menor hay que escribirla: int n = (int) 9.99; → 9.',
  'El casting a entero **trunca**, no redondea. Para redondear se usa Math.round().' ]},
 { id:'6', t:'Constantes y nombres', p:[
  '**final** hace que una variable solo se pueda asignar una vez: final double IVA = 0.21;',
  'Convenciones: variables y métodos en **camelCase**, clases en **PascalCase** y constantes en **MAYÚSCULAS_CON_GUIONES**.',
  'Java distingue mayúsculas y minúsculas: edad y Edad son variables distintas.' ]},
],
2: [
 { id:'1', t:'Condicionales if / else', p:[
  'if (condición) { ... } else if (otra) { ... } else { ... }',
  'Solo se ejecuta la **primera rama** cuya condición sea verdadera.',
  { code:'if (nota >= 9) System.out.println("Sobresaliente");\nelse if (nota >= 5) System.out.println("Aprobado");\nelse System.out.println("Suspenso");' },
  'Para comparar **String** se usa .equals(), no ==.' ]},
 { id:'2', t:'switch', p:[
  'Elige una rama según el valor de una expresión: int, char, String o enum (no double ni boolean).',
  'En el switch clásico, sin **break** la ejecución **cae** al siguiente case (fall-through).',
  '**default** se ejecuta si no coincide ningún case.',
  { code:'switch (dia) {\n  case 6: case 7:\n    System.out.println("Finde");\n    break;\n  default:\n    System.out.println("Laborable");\n}' },
  'Desde Java 14, con flechas no hay fall-through: case 6, 7 -> "Finde";' ]},
 { id:'3', t:'Bucles while y do-while', p:[
  '**while**: comprueba la condición **antes**; puede no ejecutarse nunca.',
  '**do-while**: comprueba **después**; se ejecuta **al menos una vez** (típico en menús).',
  { code:'int i = 1, suma = 0;\nwhile (i <= 4) { suma += i; i++; }  // suma = 10' },
  'Si la condición nunca se vuelve falsa: **bucle infinito**.' ]},
 { id:'4', t:'Bucle for y for-each', p:[
  'for (inicialización; condición; actualización) { cuerpo }',
  'Orden: inicialización **una vez** → condición → cuerpo → actualización → condición...',
  '**for-each**: for (int n : numeros) recorre todos los elementos sin usar índices.',
  { code:'int[] numeros = {4, 8, 15};\nfor (int n : numeros) System.out.println(n);' } ]},
 { id:'5', t:'break y continue', p:[
  '**break**: sale del bucle (o del switch) inmediatamente.',
  '**continue**: salta el resto de la vuelta actual y pasa a la siguiente.' ]},
 { id:'6', t:'Operador ternario', p:[
  'condición ? valorSiTrue : valorSiFalse',
  { code:'String msg = edad >= 18 ? "adulto" : "menor";' },
  'Úsalo para asignaciones cortas. Si hay más lógica, mejor un if.' ]},
],
},
HIS: {
1: [
 { id:'1', t:'Concepto y cronología', p:[
  'Paso de una economía **agraria y artesanal** a otra **industrial y mecanizada**.',
  'Empieza en **Gran Bretaña** en la segunda mitad del **siglo XVIII** (≈1760-1840).',
  'Se extiende después a Bélgica, Francia, Alemania, EE. UU. y, más tarde, a Japón y Rusia.' ]},
 { id:'2', t:'Por qué en Gran Bretaña', p:[
  '**Revolución agrícola**: cercamientos (enclosures), rotación de cultivos sin barbecho y más productividad.',
  '**Crecimiento demográfico**: más mano de obra y más consumidores.',
  '**Capital** acumulado gracias al comercio colonial.',
  '**Materias primas**: carbón y hierro abundantes.',
  '**Estabilidad política** y una monarquía parlamentaria favorable a los negocios. Buena red de **canales** y puertos.' ]},
 { id:'3', t:'Inventos clave', p:[
  { tb:[['Año','Invento','Autor'],['1733','Lanzadera volante','John Kay'],['c. 1764','Spinning jenny','James Hargreaves'],['1769','Water frame','Richard Arkwright'],['1769','Máquina de vapor mejorada','James Watt'],['1825','Línea Stockton–Darlington','George Stephenson'],['1829','Locomotora Rocket','George Stephenson'],['1830','Línea Liverpool–Manchester','—']] },
  'El **textil del algodón** fue el primer sector mecanizado.',
  'La **máquina de vapor** liberó a las fábricas de depender de los ríos.',
  'El **ferrocarril** abarató el transporte y tiró de la siderurgia y del carbón.' ]},
 { id:'4', t:'Sistema fabril y sociedad', p:[
  'La **fábrica** concentra obreros y máquinas y fija horarios y salarios.',
  '**Éxodo rural**: las ciudades crecen deprisa, con barrios obreros insalubres.',
  'Nuevas clases: **burguesía industrial** (dueña de los medios de producción) y **proletariado** (trabaja por un salario).',
  'Jornadas de 12-14 horas, **trabajo infantil** y femenino peor pagado, sin protección social.' ]},
 { id:'5', t:'El movimiento obrero', p:[
  '**Ludismo** (≈1811-1816): destrucción de máquinas.',
  '**Sindicatos** (trade unions): las Combination Acts los prohibían y se derogaron en 1824.',
  '**Cartismo**: la Carta del Pueblo (1838) pedía el sufragio universal masculino.',
  '**Marxismo**: el Manifiesto Comunista (Marx y Engels, 1848). Fundación de la **AIT** (Primera Internacional) en 1864.' ]},
 { id:'6', t:'Segunda Revolución Industrial', p:[
  'Desde ≈**1870** hasta 1914.',
  'Nuevas energías: **electricidad** y **petróleo** (motor de combustión).',
  'Nuevos sectores: **acero** (convertidor Bessemer, 1856), **química**, automóvil.',
  'Inventos: teléfono (Bell, 1876), bombilla (Edison, 1879).',
  'Organización: **cadena de montaje** (Ford, 1913) y grandes empresas y monopolios.' ]},
],
2: [
 { id:'1', t:'El Antiguo Régimen y la Ilustración', p:[
  'Sociedad **estamental**: clero (1.º), nobleza (2.º) y **Tercer Estado** (3.º, la inmensa mayoría y quien pagaba los impuestos).',
  '**Monarquía absoluta**: Luis XVI reunía todos los poderes.',
  'Ideas **ilustradas**: razón, crítica a los privilegios.',
  '  **Montesquieu**: separación de poderes.',
  '  **Rousseau**: contrato social y soberanía popular.',
  '  **Voltaire**: tolerancia y crítica a la Iglesia.' ]},
 { id:'2', t:'Causas', p:[
  '**Crisis financiera**: deuda enorme (incluida la ayuda a la independencia de EE. UU.).',
  '**Malas cosechas** en 1788: subida del pan y hambre.',
  'Burguesía rica sin poder político, influida por la Ilustración.',
  'Negativa de los privilegiados a pagar impuestos.' ]},
 { id:'3', t:'1789: el estallido', p:[
  '**5 de mayo**: el rey reúne los Estados Generales (voto por estamento).',
  '**17-20 de junio**: el Tercer Estado se proclama **Asamblea Nacional** y hace el **Juramento del Juego de Pelota** (no separarse hasta tener Constitución).',
  '**14 de julio**: **toma de la Bastilla**.',
  'Verano: **Gran Miedo** en el campo. **4 de agosto**: abolición de los privilegios feudales.',
  '**26 de agosto**: **Declaración de los Derechos del Hombre y del Ciudadano**.' ]},
 { id:'4', t:'Monarquía constitucional (1789-1792)', p:[
  '**Constitución de 1791**: separación de poderes, rey con poder limitado y sufragio **censitario**.',
  '**Huida a Varennes** (junio de 1791): el rey intenta escapar y lo detienen.',
  '**1792**: guerra contra Austria y Prusia. Asalto a las Tullerías y caída de la monarquía.' ]},
 { id:'5', t:'República y Terror (1792-1794)', p:[
  '**Septiembre de 1792**: se proclama la **República**. Gobierna la **Convención**.',
  '**21 de enero de 1793**: Luis XVI es guillotinado.',
  '**Girondinos** (moderados) frente a **jacobinos** (radicales).',
  '**Terror** (1793-1794): los jacobinos de **Robespierre** gobiernan desde el **Comité de Salvación Pública** con miles de ejecuciones.',
  '**Termidor** (julio de 1794): caída y ejecución de Robespierre.' ]},
 { id:'6', t:'Directorio y Napoleón', p:[
  '**Directorio** (1795-1799): república moderada e inestable.',
  '**18 de brumario** (9 de noviembre de 1799): golpe de Napoleón. Empieza el **Consulado**.',
  '**1804**: Napoleón se corona **emperador** y aprueba el **Código Civil**.',
  'Expande las ideas revolucionarias por Europa hasta su derrota final en **Waterloo** (1815).' ]},
],
},
};

// ═════════════════════════ ESQUEMA (vista resumen) ═════════════════════════
// Indexado por tema → módulo.
const RESUMEN = {
1: {
 JAVA: [
  { id:'1', t:'Ejecución', p:['.java → **javac** → .class (**bytecode**) → **JVM**','JDK ⊃ JRE ⊃ JVM'] },
  { id:'3', t:'Tipos', p:['8 primitivos: byte, short, **int (32)**, long, float, **double (64)**, char, boolean','**String** = clase'] },
  { id:'4', t:'Operadores', p:['int / int = **división entera**; % = resto','x++ usa y suma · ++x suma y usa','&& || con **cortocircuito**'] },
  { id:'5', t:'Casting', p:['Pequeño → grande: automático','Grande → pequeño: (tipo), **trunca**'] },
 ],
 HIS: [
  { id:'1', t:'Dónde y cuándo', p:['**Gran Bretaña**, 2.ª mitad del s. XVIII'] },
  { id:'2', t:'Causas', p:['Revolución agrícola · demografía · capital colonial · carbón y hierro · estabilidad'] },
  { id:'3', t:'Inventos', p:['Textil (Kay, Hargreaves, Arkwright) → vapor (**Watt 1769**) → tren (**Stephenson**, 1830)'] },
  { id:'5', t:'Obreros', p:['Ludismo → sindicatos → cartismo (1838) → **Manifiesto Comunista (1848)**'] },
  { id:'6', t:'2.ª RI (≈1870)', p:['**Electricidad + petróleo**, acero, química, cadena de montaje (Ford 1913)'] },
 ],
},
2: {
 JAVA: [
  { id:'1', t:'Condicionales', p:['if / else if / else: solo la **primera** que se cumple','switch: sin **break** hay fall-through'] },
  { id:'3', t:'Bucles', p:['while: 0 o más veces · **do-while: al menos 1**','for: init → cond → cuerpo → update'] },
  { id:'5', t:'Saltos', p:['**break** sale · **continue** pasa a la siguiente vuelta'] },
  { id:'6', t:'Ternario', p:['cond **?** a **:** b'] },
 ],
 HIS: [
  { id:'1', t:'Antiguo Régimen', p:['3 estamentos; paga el **Tercer Estado**','Montesquieu = separación de poderes'] },
  { id:'3', t:'1789', p:['Estados Generales → Juego de Pelota → **Bastilla (14 jul)** → Declaración de Derechos'] },
  { id:'4', t:'1791', p:['Monarquía constitucional · Varennes'] },
  { id:'5', t:'1792-94', p:['República · Luis XVI ejecutado (1793) · **Terror** (Robespierre)'] },
  { id:'6', t:'1795-1804', p:['Directorio → **18 de brumario (1799)** → Consulado → Imperio (1804)'] },
 ],
},
};

// Texto literal del temario (vista "Original"). Vacío en la demo: la pestaña se oculta sola.
// Forma: { 'JAVA-1': { n: páginas, secs: [{ id, t, pg:[nº página], b:[['p'|'li'|'li2'|'code'|'fig'|'media', texto, página]] }] } }
const TEMARIO = {};

// ═════════════════════════ TRUCOS ═════════════════════════
const TRUCOS = {
JAVA: {
 1: [
  { ref:'1', t:'JDK, JRE y JVM', x:'Como unas muñecas rusas: el JDK (para programar) lleva dentro el JRE (para ejecutar), que lleva dentro la JVM (la que ejecuta de verdad).' },
  { ref:'4', t:'x++ frente a ++x', x:'Lee el símbolo en orden: en x++ primero aparece la x (se usa) y luego el ++ (se suma). En ++x es al revés.' },
  { ref:'5', t:'El casting trunca', x:'Piensa en una guillotina: (int) 9.99 corta los decimales y se queda en 9. No redondea nunca.' },
 ],
 2: [
  { ref:'3', t:'do-while', x:'"Primero dispara y luego pregunta": hace el cuerpo y después mira la condición. Por eso se ejecuta al menos una vez.' },
  { ref:'5', t:'break frente a continue', x:'break = salir del edificio. continue = saltarte esta planta y seguir subiendo.' },
  { ref:'2', t:'Fall-through', x:'Un case sin break es como un tobogán sin freno: caes en el siguiente.' },
 ],
},
HIS: {
 1: [
  { ref:'3', t:'Orden de los inventos', x:'Tela → fuerza → viaje: primero se mecaniza el textil, luego llega el vapor y por último el ferrocarril.' },
  { ref:'6', t:'1.ª frente a 2.ª Revolución Industrial', x:'La 1.ª huele a carbón (vapor y algodón). La 2.ª huele a gasolina y tiene luz (petróleo y electricidad).' },
 ],
 2: [
  { ref:'3', t:'1789 en cuatro pasos', x:'"Reunión, juramento, asalto, derechos": Estados Generales, Juego de Pelota, Bastilla y Declaración.' },
  { ref:'1', t:'Montesquieu frente a Rousseau', x:'Montesquieu reparte el poder en tres; Rousseau se lo da al pueblo.' },
  { ref:'6', t:'Etapas', x:'M-C-D-C-I: Monarquía constitucional, Convención, Directorio, Consulado e Imperio.' },
 ],
},
};

// ═════════════════════════ CONCEPTOS (Explícamelo) ═════════════════════════
// [nombre, ref del apartado]. Varios apartados: '3+4'.
const CONCEPTOS = {
JAVA: { 1: [['Compilación y JVM','1'],['Tipos primitivos y String','3'],['Pre y postincremento','4'],['Casting implícito y explícito','5']],
        2: [['if / else if','1'],['switch y fall-through','2'],['while frente a do-while','3'],['break y continue','5']] },
HIS:  { 1: [['Causas de la Revolución Industrial','2'],['Sistema fabril y clases sociales','4'],['Movimiento obrero','5'],['Segunda Revolución Industrial','6']],
        2: [['Sociedad estamental','1'],['Los hechos de 1789','3'],['El Terror','5'],['El ascenso de Napoleón','6']] },
};

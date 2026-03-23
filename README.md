# Survivors 2

Un juego de estrategia por turnos basado en web desarrollado en **TypeScript** con **Vite**. Dirige tu ejército en batallas tácticas, compra nuevas unidades, sube de nivel y completa desafíos especiales.

## ✨ Características

- **Combate por turnos táctico**: Controla unidades con movimiento y ataque limitados
- **Sistema de economía**: Gana oro derrotando enemigos y úsalo para comprar nuevas unidades
- **Sistema de experiencia**: Sube de nivel tus unidades para mejorar sus estadísticas
- **Múltiples terrenos**: Each tile ofrece bonificaciones de defensa diferentes (agua, tierra, rocas, pasto, bosque)
- **Sistema de habilidades**: Las unidades pueden aprender y usar habilidades especiales en combate
- **Desafíos especiales**: Completa mapas de desafío con condiciones específicas
- **Guardado de partida**: Guarda tu progreso y continúa más tarde
- **Tabla de puntuaciones**: Compite por la mejor puntuación
- **Música y efectos de sonido**: Ambienta la batalla con audio dinámico

## 📋 Requisitos Previos

- **Node.js** (v16 o superior)
- **npm** o **yarn**

## 🚀 Instalación

1. **Clona el repositorio** (o descarga el proyecto):
```bash
git clone <repository-url>
cd survivors2
```

2. **Instala las dependencias**:
```bash
npm install
```

## 🎮 Cómo Ejecutar

### Modo Desarrollo
```bash
npm run dev
```
El juego estará disponible en `http://localhost:5173`

### Compilación de Producción
```bash
npm run build
```

### Vista Previa de Producción
```bash
npm run preview
```

## 🕹️ Controles del Juego

### Navegación General
| Tecla | Acción |
|-------|--------|
| **↑ ↓ ← →** | Mover cursor |
| **ESPACIO** | Seleccionar/Confirmar |
| **ESC** | Cerrar menú / Cancelar acción |

### Durante el Turno del Jugador
| Acción | Controles |
|--------|-----------|
| **Mover cursor** | Flechas direccionales (↑ ↓ ← →) |
| **Seleccionar unidad** | ESPACIO sobre la unidad |
| **Abrir menú de unidad** | ESPACIO sobre unidad propia |
| **Ver info de enemigo** | ESPACIO sobre unidad enemiga |
| **Menú de casilla vacía** | ESPACIO en casilla vacía |

### Menú de Unidad
| Opción | Atajo |
|--------|-------|
| **Mover** | ESPACIO (si no se ha movido) |
| **Atacar** | ESPACIO |
| **Habilidad** | ESPACIO (si tiene habilidades) |
| **Esperar** | ESPACIO |
| **Cancelar** | ESC |

### Fase de Despliegue
| Tecla | Acción |
|-------|--------|
| **↑ ↓ ← →** | Mover cursor |
| **ESPACIO** | Colocar unidad o finalizar despliegue |
| **ESC** | Finalizar despliegue (si todas están colocadas) |

### Menú Vacío (ESPACIO en casilla vacía)
| Opción | Atajo |
|--------|-------|
| **End Turn** | ESPACIO |
| **Save Game** | ESPACIO |
| **Load Game** | ESPACIO |
| **Exit** | ESPACIO |
| **Navegar** | ↑ ↓ |

### Selección de Objetivo de Ataque
| Tecla | Acción |
|-------|--------|
| **← →** / **↑ ↓** | Cambiar objetivo |
| **ESPACIO** | Confirmar ataque |
| **ESC** | Cancelar ataque |

### Menú Principal
| Tecla | Acción |
|-------|--------|
| **↑ ↓** | Navegar opciones |
| **→ ←** | Ajustar volumen (en configuración) |
| **ESPACIO** | Seleccionar opción |
| **ESC** | Volver atrás |

## 📖 Cómo Jugar

### Objetivo Principal
Derrota enemigos, gana batallas y avanza lo más posible. Tu goal es sobrevivir el máximo número de batallas.

### Flujo de Juego

1. **Menú Principal**: Elige comenzar una nueva partida, continuar, ver desafíos o configuración
2. **Tienda**: Compra nuevas unidades con tu oro inicial
3. **Fase de Despliegue**: Coloca tus unidades en las casillas azules de la izquierda
4. **Batalla**: 
   - Tu turno: Mueve tus unidades, ataca enemigos, usa habilidades
   - Turno del enemigo: Los enemigos atacan automáticamente
5. **Victoria/Derrota**: 
   - Gana: Recibe recompensas y avanza a la siguiente batalla
   - Derrota: Ingresa tu nombre en la tabla de puntuaciones

### Estadísticas de Unidades
- **HP**: Puntos de vida
- **MP**: Puntos de magia (usado para habilidades)
- **ATK**: Daño base
- **CA**: Clase de armadura (defensa contra ataques)
- **DEF**: Defensa base

### Terrenos
- **Agua**: +DEF, ralentiza movimiento
- **Tierra**: Normal
- **Rocas**: +DEF, impassable para algunos
- **Pasto**: +Movimiento
- **Bosque**: +DEF

## 📁 Estructura del Proyecto

```
survivors2/
├── src/
│   ├── main.ts                 # Punto de entrada
│   ├── core/
│   │   ├── Game.ts            # Lógica principal del juego
│   │   └── Types.ts           # Definiciones de tipos
│   ├── map/                   # Gestión del mapa
│   ├── units/                 # Sistema de unidades
│   ├── systems/               # Sistemas principales (combate, IA, etc.)
│   ├── database/              # Bases de datos (unidades, habilidades, etc.)
│   ├── ui/                    # Interfaz de usuario
│   ├── render/                # Renderización gráfica
│   └── audio/                 # Gestión de sonido
├── public/
│   ├── assets/
│   │   ├── sprites/           # Gráficos de unidades y UI
│   │   ├── sounds/            # Efectos de sonido y música
│   │   └── maps/              # Diseños de mapas
│   └── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 🔧 Configuración

### GameConfig.ts
Puedes modificar los parámetros del juego en [src/config/GameConfig.ts]:

- Tamaño del lienzo
- Dimensiones del mapa
- Velocidades de movimiento
- Colores de UI
- Y más...

## 🎨 Personalización

### Añadir Nuevas Unidades
Edita [src/database/UnitDatabase.ts] para agregar nuevas unidades

### Crear Nuevos Mapas
Los mapas están en `public/assets/maps/` en formato JSON

### Modificar Habilidades
Edita [src/database/AbilityDatabase.ts] para crear nuevas habilidades

## 🐛 Solución de Problemas

**No se cargan los sprites:**
- Verifica que los archivos están en `public/assets/sprites/`
- Recuerda que en modo desarrollo necesitas `npm run dev`

**No hay sonido:**
- Los archivos de sonido deben estar en `public/assets/sounds/`
- Comprueba la configuración de volumen en el menú

**El juego se ralentiza:**
- Reduce la calidad gráfica o el tamaño del mapa
- Verifica la configuración de `GameConfig.ts`

## 💾 Guardando el Progreso

El juego guarda automáticamente:
- Tu partida actual (unidades, oro, batalla)
- Tabla de puntuaciones de derrotas
- Desafíos completados

Los datos se almacenan en el navegador (localStorage).

## 🎯 Desafíos

Completa mapas especiales con reglas únicas:
- Tiempo limitado
- Número máximo de unidades
- Objetivos específicos
- Condiciones de victoria alternativas

## 📊 Estadísticas e Información

Durante el juego puedes ver:
- **Barra superior**: Batalla actual, turno, oro, cantidad de unidades
- **Información de casilla**: Tipo de terreno, bonificación de defensa
- **Información de unidad**: Estadísticas completas de la unidad seleccionada

## 🤝 Contribuir

Las contribuciones son bienvenidas. Para cambios mayores, abre una issue primero.

## 📝 Licencia

Este proyecto está bajo licencia MIT - consulta el archivo LICENSE para más detalles.

## 👨‍💻 Autor

**Miguel** - Desarrollador([Instituto](https://example.com))

## 🙏 Agradecimientos

- Inspirado en juegos tácticos clásicos como Fire Emblem y Final Fantasy Tactics
- TypeScript y Vite por las herramientas excelentes
- La comunidad de desarrolladores indie

---

**¡Diviértete jugando!** 🎮

Para reportar bugs o sugerir features, abre una issue en el repositorio.

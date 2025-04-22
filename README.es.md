<h1 align="center">
  <a href="README.es.md">
    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Flag_of_Spain.svg/30px-Flag_of_Spain.svg.png" alt="Bandera de España"> <!-- Aumenté un poco el tamaño de la bandera -->
  </a>
   
  <a href="README.en.md">
    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Flag_of_the_United_States.svg/30px-Flag_of_the_United_States.svg.png" alt="USA Flag" width="37"> <!-- Aumenté un poco el tamaño de la bandera -->
  </a>
   
  FEUCSC - Portal de Transparencia Financiera
</h1>

<p align="center">
  <em>Aplicación web para la visualización transparente de las finanzas de la Federación de Estudiantes UCSC.</em>
</p>

<p align="center">
  <!-- Iconos/Badges de tecnologías principales -->
  <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React Badge"/>
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript Badge"/>
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite Badge"/>
  <img src="https://img.shields.io/badge/Material%20UI-007FFF?style=for-the-badge&logo=mui&logoColor=white" alt="Material UI Badge"/>
  <img src="https://img.shields.io/badge/Tailwind%20CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS Badge"/>
  <img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase Badge"/>
  <img src="https://img.shields.io/badge/Motion-E00094?style=for-the-badge&logo=framer&logoColor=white" alt="Motion Badge"/>
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge" alt="License: MIT"/>
</p>

<p align="center">
  <a href="https://feucsc-dd7bb.web.app/" target="_blank">
    <img src="/page.gif" alt="Vista previa" width="85%">
  </a>

---

## Descripción General

Este repositorio contiene el código fuente de la aplicación web desarrollada para la **Federación de Estudiantes de la Universidad Católica de la Santísima Concepción (FEUCSC)**.

El objetivo principal de esta aplicación es proporcionar una plataforma moderna y de fácil acceso para que la comunidad estudiantil y cualquier interesado pueda visualizar de forma **transparente** los movimientos financieros (ingresos y egresos) gestionados por la federación.

Este repositorio sirve como **demostración pública** del proyecto, sus funcionalidades clave y las tecnologías implementadas.

---

## Características Principales

<br/>

- **Dashboard Resumen:** Visualización clara de los totales de ingresos y egresos, con datos actualizados.
- **Listado Detallado de Movimientos:** Presentación de todas las transacciones financieras registradas, incluyendo fecha, descripción, monto y tipo (Ingreso/Egreso).
- **Herramientas de Búsqueda y Filtrado:** Permite a los usuarios encontrar transacciones específicas mediante filtros por mes, tipo de movimiento y búsqueda por descripción.
- **Opciones de Ordenamiento:** Facilita la navegación y el análisis de datos permitiendo ordenar los movimientos por fecha o número de boleta/comprobante.
- **Visualización de Comprobantes:** Posibilidad de ver imágenes digitales de los comprobantes asociados a cada transacción para una mayor verificación.
- **Interfaz de Usuario Intuitiva y Responsiva:** Desarrollada con React, Material UI y Tailwind CSS, garantizando una experiencia de usuario fluida y adaptada a diferentes tamaños de pantalla (escritorio, tablet, móvil).
- **Sección de Preguntas Frecuentes (FAQ):** Un apartado dedicado a responder dudas comunes sobre el portal y las finanzas de la FEUCSC.
- **Panel de Administración (Acceso Restringido):** Incluye un módulo interno para la gestión de datos (CRUD - Crear, Leer, Actualizar, Eliminar) por parte de los administradores de la FEUCSC. **Este panel no es accesible públicamente en la versión desplegada.**
  <br/>

---

## Tecnologías Utilizadas

| Area          | Technology                                                                                                                                                                                     | Description                                                                                                                       |
| :------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend**  | <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/react/react-original.svg" alt="React" width="16"/> React                                                             | Libreria para UI (+ React Router Dom V6)                                                                                          |
|               | <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/typescript/typescript-original.svg" alt="TypeScript" width="16"/> TypeScript                                         | Lenguaje para tipado estatico                                                                                                     |
|               | <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/vitejs/vitejs-original.svg" alt="Vite" width="16"/> Vite                                                             | Como bundler y entorno de desarrollo                                                                                              |
|               | <img src="https://raw.githubusercontent.com/devicons/devicon/ca28c779441053191ff11710fe24a9e6c23690d6/icons/tailwindcss/tailwindcss-original.svg" alt="Tailwind CSS" width="16"/> Tailwind CSS | Framework para CSS                                                                                                                |
| **Backend**   | <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/firebase/firebase-plain.svg" alt="Firebase" width="16"/> Firebase                                                    | Firestore (Base de datos NoSQL)<br/> Authentication (Para el panel de administración) <br/> Storage (Para almacenar comprobantes) |
| **Libraries** | `Material UI`                                                                                                                                                                                  | Libreria de Componentes React                                                                                                     |
|               | `Motion`                                                                                                                                                                                       | Animation Library (React/JS)                                                                                                      |

---

## Web en Vivo

Puedes explorar e interactuar con la versión desplegada de la aplicación visitando el enlace:

<p align="center">
  <a href="https://feucsc-dd7bb.web.app" target="_blank">
    <img src="https://img.shields.io/badge/Visitar%20Web%20en%20Vivo-a855f7?style=for-the-badge&logo=firefoxbrowser&logoColor=white" alt="Visitar Web en Vivo"/>
  </a>
</p>

---

## Autor

<p align="center">
  <em>Felipe Arce</em>
</p>

<p align="center">
  <a href="mailto:felipearce.2004@gmail.com" target="_blank">
    <img src="https://img.shields.io/badge/-Email-D14836?style=flat-square&logo=gmail&logoColor=white" alt="Email"/>
  </a>
    
  <a href="https://github.com/pipe1os" target="_blank">
    <img src="https://img.shields.io/badge/-GitHub-181717?style=flat-square&logo=github&logoColor=white" alt="GitHub"/>
  </a>
    
  <a href="https://www.linkedin.com/in/felipe-arce-aqueveque-5b5485292" target="_blank">
    <img src="https://img.shields.io/badge/-LinkedIn-0A66C2?style=flat-square&logo=linkedin&logoColor=white" alt="LinkedIn"/>
  </a>
</p>

---

## Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo [LICENSE](LICENSE) para más detalles.

<p align="center"><img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge" alt="License: MIT"></p>

/** @type {import('postcss-load-config').Config} */
module.exports = {
  // El objeto 'plugins' define qué herramientas de PostCSS se van a usar.
  plugins: {
    // 1. Tailwind CSS: Debe ser el primer plugin.
    'tailwindcss': {},
    
    // 2. Autoprefixer: Asegura la compatibilidad con navegadores.
    'autoprefixer': {},
    
    // Puedes añadir otros plugins de PostCSS aquí si los necesitas.
    // Ejemplo: 'postcss-nested': {},
  },
}
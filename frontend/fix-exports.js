// Quick script to add default exports to components
// Run this with: node fix-exports.js

const fs = require('fs')
const path = require('path')

const components = [
  'src/pages/AboutPage.jsx',
  'src/pages/auth/LoginPage.jsx', 
  'src/pages/auth/RegisterPage.jsx',
  'src/pages/admin/AdminDashboard.jsx',
  'src/pages/chef/ChefDashboard.jsx',
  'src/pages/waiter/WaiterDashboard.jsx',
  'src/pages/customer/CustomerDashboard.jsx'
]

components.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath)
  
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8')
    
    // Check if default export already exists
    if (!content.includes('export default')) {
      // Get the component name from the export statement
      const exportMatch = content.match(/export\s+const\s+(\w+)\s*=/)
      if (exportMatch) {
        const componentName = exportMatch[1]
        
        // Add default export at the end
        content += `\nexport default ${componentName}\n`
        
        fs.writeFileSync(fullPath, content)
        console.log(`✅ Fixed ${filePath}`)
      }
    } else {
      console.log(`⏭️  Skipped ${filePath} (already has default export)`)
    }
  } else {
    console.log(`❌ File not found: ${filePath}`)
  }
})

console.log('🎉 Export fixing complete!')

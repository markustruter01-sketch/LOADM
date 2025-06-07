import { db } from "./db";
import { phoneDirectory } from "@shared/schema";

async function testSorting() {
  try {
    console.log('Testing phone directory sorting...');
    
    const directories = await db.select().from(phoneDirectory);
    console.log('Raw data count:', directories.length);
    console.log('First 5 unsorted names:', directories.slice(0, 5).map(d => d.airbaseName));
    
    // Sort alphabetically
    const sortedDirectories = directories.sort((a, b) => 
      a.airbaseName.localeCompare(b.airbaseName, 'en', { sensitivity: 'base' })
    );
    
    console.log('First 5 sorted names:', sortedDirectories.slice(0, 5).map(d => d.airbaseName));
    console.log('All sorted names:');
    sortedDirectories.forEach((d, i) => {
      console.log(`${i + 1}. ${d.airbaseName}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testSorting()
  .then(() => {
    console.log('Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });
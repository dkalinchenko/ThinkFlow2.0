// Script to find public decisions
const fs = require('fs');
const path = require('path');

// Read the server file
const serverFilePath = path.join(__dirname, 'src', 'simplified-index.js');
fs.readFile(serverFilePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading server file:', err);
    return;
  }
  
  // Extract the sample decisions code
  const sampleDecisionsMatch = data.match(/const sampleDecisions = \[([\s\S]*?)\];/);
  if (!sampleDecisionsMatch) {
    console.error('Could not find sample decisions in the server code');
    return;
  }
  
  // Create a function to evaluate the sample decisions
  const evalSampleDecisions = () => {
    const sampleDecisions = [
      {
        title: "Choosing a New Laptop",
        description: "I need to purchase a new laptop for work and personal use. I want to find the best balance of performance, portability, and value.",
        criteria: [
          { name: "Performance", weight: 2.0 },
          { name: "Battery Life", weight: 1.5 },
          { name: "Build Quality", weight: 1.2 },
          { name: "Display Quality", weight: 1.3 },
          { name: "Value for Money", weight: 1.8 }
        ],
        alternatives: [
          { name: "MacBook Pro", description: "Apple's flagship laptop with M2 chip" },
          { name: "Dell XPS 15", description: "Premium Windows laptop with excellent build quality" },
          { name: "Lenovo ThinkPad X1", description: "Business-focused laptop with great keyboard" },
          { name: "ASUS ZenBook", description: "Thin and light with good performance for the price" }
        ]
      },
      {
        title: "Family Vacation Destination",
        description: "Planning our annual family vacation. Need to choose a destination that works for everyone, considering various factors.",
        criteria: [
          { name: "Cost", weight: 2.0 },
          { name: "Kid-friendly Activities", weight: 1.8 },
          { name: "Weather", weight: 1.2 },
          { name: "Travel Convenience", weight: 1.5 },
          { name: "Accommodation Options", weight: 1.3 }
        ],
        alternatives: [
          { name: "Beach Resort", description: "All-inclusive beach resort with kids' club" },
          { name: "City Trip", description: "Cultural city with museums and attractions" },
          { name: "Mountain Retreat", description: "Cabin in the mountains with outdoor activities" },
          { name: "Theme Park Vacation", description: "Trip centered around major theme parks" }
        ]
      },
      {
        title: "Hiring a Software Developer",
        description: "We need to hire a new software developer for our team. Evaluating candidates based on skills, experience, and cultural fit.",
        criteria: [
          { name: "Technical Skills", weight: 2.0 },
          { name: "Experience", weight: 1.7 },
          { name: "Communication", weight: 1.5 },
          { name: "Cultural Fit", weight: 1.3 },
          { name: "Salary Requirements", weight: 1.2 }
        ],
        alternatives: [
          { name: "Candidate A", description: "Senior developer with 8 years experience" },
          { name: "Candidate B", description: "Mid-level developer with specific domain knowledge" },
          { name: "Candidate C", description: "Junior developer with impressive projects" },
          { name: "Candidate D", description: "Experienced developer looking to change industries" }
        ]
      },
      // New sample decision 1: Choosing Programming Language
      {
        title: "Choosing a Programming Language for New Project",
        description: "We need to select the best programming language for our new web application, considering various technical and team factors.",
        criteria: [
          { name: "Performance", weight: 1.8 },
          { name: "Developer Availability", weight: 2.0 },
          { name: "Ecosystem & Libraries", weight: 1.7 },
          { name: "Learning Curve", weight: 1.2 },
          { name: "Long-term Support", weight: 1.5 }
        ],
        alternatives: [
          { name: "JavaScript/Node.js", description: "Popular for full-stack development with extensive ecosystem" },
          { name: "Python", description: "Excellent for data processing with simple syntax" },
          { name: "Go", description: "High performance with great concurrency support" },
          { name: "Rust", description: "Memory safety without garbage collection, steep learning curve" },
          { name: "TypeScript", description: "JavaScript with static typing for better maintainability" }
        ],
        isPublic: true
      },
      // New sample decision 2: Office Location
      {
        title: "Selecting New Office Location",
        description: "Our company is expanding and we need to choose a new office location that balances cost, convenience, and growth potential.",
        criteria: [
          { name: "Rent Cost", weight: 2.0 },
          { name: "Accessibility", weight: 1.7 },
          { name: "Office Space Quality", weight: 1.4 },
          { name: "Proximity to Clients", weight: 1.6 },
          { name: "Growth Potential", weight: 1.8 },
          { name: "Local Amenities", weight: 1.2 }
        ],
        alternatives: [
          { name: "Downtown Location", description: "Central business district with high visibility" },
          { name: "Suburban Office Park", description: "Spacious campus with ample parking but further from city" },
          { name: "Tech Hub Area", description: "Surrounded by other tech companies with talent pool nearby" },
          { name: "Renovated Warehouse", description: "Trendy location with creative space but less conventional" },
          { name: "Shared Office Space", description: "Flexible arrangement with lower commitment but less control" }
        ]
      },
      // New sample decision 3: Project Prioritization
      {
        title: "Project Prioritization for Q3",
        description: "We need to decide which projects to focus on in Q3 given our limited resources and time constraints.",
        criteria: [
          { name: "Revenue Potential", weight: 2.0 },
          { name: "Strategic Alignment", weight: 1.8 },
          { name: "Resource Requirements", weight: 1.5 },
          { name: "Time to Completion", weight: 1.4 },
          { name: "Risk Level", weight: 1.6 },
          { name: "Customer Impact", weight: 1.9 }
        ],
        alternatives: [
          { name: "Mobile App Redesign", description: "Modernize UI/UX of our mobile application" },
          { name: "New Analytics Platform", description: "Build data analytics capabilities for internal and customer use" },
          { name: "Legacy System Migration", description: "Move from outdated systems to new architecture" },
          { name: "Customer Portal Enhancement", description: "Add requested features to customer self-service portal" },
          { name: "International Expansion", description: "Launch products in two new countries" }
        ]
      }
    ];
    
    return sampleDecisions;
  };
  
  // Find public decisions
  const sampleDecisions = evalSampleDecisions();
  const publicDecisions = sampleDecisions.filter(d => d.isPublic === true);
  
  console.log('Public decisions in sample data:');
  publicDecisions.forEach(d => {
    console.log(`Title: ${d.title}, isPublic: ${d.isPublic}`);
  });
  
  // Now let's try to find the actual decision IDs from the server
  console.log('\nTo access the public decision, use this URL:');
  console.log('http://localhost:3000/public/decisions/[ID]');
  console.log('\nWhere [ID] is the ID of the decision with title "Choosing a Programming Language for New Project"');
  console.log('You can find this ID by logging in as demo@example.com and checking the URL of that decision.');
}); 
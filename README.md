# AI-Powered Cucumber Feature Generator

An intelligent platform that simplifies Behavior-Driven Development (BDD) by generating, analyzing, and managing Cucumber feature files through AI assistance.

## 🌟 Key Features

### Feature Generation & Management
- AI-powered generation of Cucumber features from user stories
- Configurable scenario count (1-10 scenarios)
- Automatic tag generation
- Search, sort, and filter capabilities
- Archive/restore feature management
- Interactive editing interface

### Complexity Analysis
- Color-coded scenario complexity visualization
- Detailed analysis of implementation factors:
  - Step count
  - Data dependencies
  - Conditional logic
  - Technical difficulty
- Real-time complexity insights
- Performance and testing recommendations

### Learning & Guidance
- Interactive Cucumber Guide
- BDD best practices documentation
- Step-by-step feature creation guidance
- Live examples and explanations

### User Experience
- Dark/Light theme support
- Responsive design
- Real-time validation
- Toast notifications
- Interactive tooltips

## 🚀 Getting Started

### Prerequisites
- Node.js v20 or higher
- PostgreSQL database
- OpenAI API key

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```env
   DATABASE_URL=your_postgresql_url
   OPENAI_API_KEY=your_openai_api_key
   ```
4. Start the application:
   ```bash
   npm run dev
   ```

## 💡 Usage Guide

### Generating Features
1. Navigate to the home page
2. Enter a feature title and user story
3. Select desired number of scenarios
4. Click "Generate Feature"

### Analyzing Complexity
1. Select a feature from the list
2. View the complexity analysis in the details panel
3. Use "Refresh Analysis" for updated insights

### Managing Features
- Use the search bar to find specific features
- Sort by title or date
- Filter between active and archived features
- Archive outdated features
- Restore archived features when needed

## 🔄 Integration with Cucumber-Playwright

This tool can be integrated with cucumber-playwright typescript framework for end-to-end testing:

### Recommended Workflow
1. Product Owners create user stories in the Feature Generator
2. AI generates initial Cucumber scenarios
3. Review complexity analysis for test planning
4. Export features to your cucumber-playwright project
5. Implement step definitions based on generated scenarios
6. Track feature evolution through the analytics dashboard

### Future Integration Features (Planned)
- Direct export to cucumber-playwright project structure
- Step definition templates generation
- Test coverage analysis
- Integration status tracking
- Automated test execution reporting

## 👥 Role-Based Features

### For Product Owners
- Simple interface for story creation
- Automatic feature file generation
- Complexity insights for planning
- Feature version management
- Analytics dashboard

### For Developers/QA
- Technical complexity analysis
- Integration points identification
- Test coverage recommendations
- Feature file export
- Version control integration

## 🛠 Tech Stack
- Next.js frontend
- Express.js backend
- OpenAI GPT-4o integration
- TypeScript
- Shadcn UI components
- PostgreSQL database
- TanStack Query
- Tailwind CSS

## 📝 Contributing
Contributions are welcome! Please read our contributing guidelines for details on our code of conduct and the process for submitting pull requests.

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

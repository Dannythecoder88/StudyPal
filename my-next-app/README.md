# StudyPal - AI-Powered Study Tracker & Planner

A modern, intelligent study planning and productivity tracking web application built with Next.js, designed to help students optimize their learning experience.

## 🚀 Features

### 🧠 Smart Planner
- **AI-Powered Scheduling**: Automatically generates optimal study schedules based on task priorities, due dates, and available time
- **Priority Management**: Intelligent task prioritization using urgency and importance
- **Adaptive Planning**: Schedule adjusts based on your actual study patterns and performance

### 📈 Performance Tracker
- **Real-time Analytics**: Track study time, focus scores, and completion rates
- **Visual Insights**: Beautiful charts showing your study patterns and progress
- **Weekly Overview**: See your study distribution across the week

### 🎯 Focus Sessions
- **Pomodoro Timer**: Built-in 25-minute focus sessions with customizable breaks
- **Session Tracking**: Log focus quality and mood after each session
- **Progress Visualization**: See your focus trends over time

### 📚 Task Management
- **Smart Task Creation**: Add tasks with subjects, priorities, and estimated time
- **Progress Tracking**: Mark tasks as complete and track your productivity
- **Due Date Management**: Never miss important deadlines

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 with React 19
- **Styling**: Tailwind CSS with custom design system
- **Icons**: Lucide React
- **Charts**: Recharts for data visualization
- **Forms**: React Hook Form with Zod validation
- **API**: Next.js API routes
- **Database**: Supabase (ready for integration)
- **AI**: OpenAI API integration for smart scheduling

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd studypal
   ```

2. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📱 Usage

### Adding Tasks
1. Click the "Add Task" button in the header or task section
2. Fill in the task details:
   - **Title**: What you need to study
   - **Subject**: Choose from predefined subjects
   - **Priority**: High, Medium, or Low
   - **Due Date**: When it needs to be completed
   - **Estimated Time**: How long you think it will take
3. Click "Add Task" to save

### Using Focus Sessions
1. Set your desired session length (default: 25 minutes)
2. Click "Start" to begin a focus session
3. Work on your selected task during the session
4. Take breaks when prompted
5. Rate your focus and mood after each session

### Tracking Progress
- View your daily study time in the "Today's Progress" card
- Check your weekly study distribution in the "Weekly Overview"
- Monitor your focus score and completed tasks

## 🔧 Configuration

### Environment Variables
Create a `.env.local` file in the root directory:

```env
# Supabase Configuration (for future use)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI Configuration (for AI scheduling)
OPENAI_API_KEY=your_openai_api_key
```

### Customization
- **Colors**: Modify the color scheme in `tailwind.config.js`
- **Subjects**: Add or modify subjects in the `AddTaskModal.tsx` component
- **Session Lengths**: Adjust default Pomodoro settings in the main page component

## 🎨 Design System

StudyPal uses a custom design system built with Tailwind CSS:

- **Primary Colors**: Blue gradient for main actions and branding
- **Success Colors**: Green for completed tasks and positive metrics
- **Warning Colors**: Yellow/Orange for medium priority items
- **Error Colors**: Red for high priority and urgent items

### Components
- **Cards**: Consistent card design with shadows and rounded corners
- **Buttons**: Primary and secondary button styles with hover effects
- **Forms**: Clean input fields with focus states and validation
- **Modals**: Overlay modals for task creation and settings

## 🔮 Future Features

### Planned Enhancements
- **Supabase Integration**: Real user authentication and data persistence
- **AI Chatbot**: GPT-powered study assistant for explaining concepts
- **Calendar Sync**: Integration with Google Calendar and Apple Calendar
- **Mobile App**: React Native version for iOS and Android
- **Gamification**: Streaks, achievements, and study challenges
- **Resource Hub**: Integration with educational APIs (YouTube, Khan Academy)
- **Dark Mode**: Toggle between light and dark themes
- **Notifications**: Push notifications for study reminders

### Advanced AI Features
- **Personalized Recommendations**: AI suggests optimal study times based on your patterns
- **Smart Breaks**: AI determines when you need breaks based on focus metrics
- **Study Resource Suggestions**: AI recommends relevant videos, articles, and practice problems
- **Performance Prediction**: AI predicts exam performance based on study patterns

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js Team** for the amazing React framework
- **Tailwind CSS** for the utility-first CSS framework
- **Lucide** for the beautiful icon set
- **OpenAI** for AI capabilities
- **Supabase** for the backend infrastructure

---

**Built with ❤️ for students everywhere**

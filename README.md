# GM AI - Intelligent Workspace

A modern, cloud-powered workspace application for organizing thoughts, notes, and daily habits. Built with React, TypeScript, and Supabase.

![GM AI Demo](https://via.placeholder.com/800x400/0a0a0a/22c55e?text=GM+AI+Workspace)

## ✨ Features

### 📝 **Smart Page Management**
- Create, edit, and organize pages hierarchically
- Rich text editing with markdown support
- Customizable page icons
- Nested page structure
- Real-time search across all content

### 🎯 **Daily Non-Negotiables**
- Track daily habits and tasks
- Priority levels (High, Medium, Low)
- Time allocation tracking
- Category organization
- Progress statistics and completion rates

### 🔐 **Secure & Cloud-Powered**
- User authentication with Supabase
- Real-time data synchronization
- Multi-device access
- Secure user data isolation
- Automatic backup and recovery

### 🎨 **Modern UI/UX**
- Dark theme with green accents
- Glassmorphism effects
- Responsive design (mobile-friendly)
- Smooth animations and transitions
- Dynamic background effects

## 🚀 Live Demo

**[Try GM AI Live →](https://your-netlify-url.netlify.app)**

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Framer Motion
- **Backend**: Supabase (Auth, Database, Real-time)
- **UI Components**: Radix UI, Lucide Icons
- **Deployment**: Netlify
- **Database**: PostgreSQL (via Supabase)

## 📦 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### 1. Clone & Install
```bash
git clone https://github.com/YOUR_USERNAME/gm-ai-workspace.git
cd gm-ai-workspace
npm install
```

### 2. Environment Setup
Create `.env.local`:
```bash
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Database Setup
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Create new project
3. Run the SQL script from `SUPABASE_SETUP.md`

### 4. Start Development
```bash
npm run dev
```

## 🌐 Deployment

### Netlify (Recommended)
1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables in Netlify dashboard
5. Deploy! 🚀

### Manual Deployment
```bash
npm run build
# Deploy the 'dist' folder to your hosting provider
```

## ⚙️ Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | ✅ |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key | ✅ |

## 📱 Features Roadmap

- [ ] **Collaboration**: Real-time collaborative editing
- [ ] **Templates**: Pre-built page templates
- [ ] **Export**: PDF/Markdown export functionality
- [ ] **Mobile App**: Native iOS/Android apps
- [ ] **Integrations**: Calendar, Notion, Google Drive
- [ ] **AI Assistant**: Smart content suggestions
- [ ] **Themes**: Multiple color themes
- [ ] **Plugins**: Extensible plugin system

## 🤝 Contributing

We love contributions! Here's how to get started:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) for the amazing backend platform
- [Tailwind CSS](https://tailwindcss.com) for the utility-first CSS framework
- [Radix UI](https://radix-ui.com) for accessible UI components
- [Lucide](https://lucide.dev) for beautiful icons

## 📞 Support

- 📧 Email: support@gmaiworkspace.com
- 🐛 Issues: [GitHub Issues](https://github.com/YOUR_USERNAME/gm-ai-workspace/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/YOUR_USERNAME/gm-ai-workspace/discussions)

---

**Built with ❤️ by [Your Name](https://github.com/YOUR_USERNAME)**

*Transform your productivity with GM AI - The Private Platform To Lock In...* 
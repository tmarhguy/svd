# SVD Interactive Image Compression

**"How Computers See: Interactive Image Compression with SVD"**

An 8-minute talk + interactive web article that replaces the traditional 5-8 page paper, featuring real-time SVD compression with a sci-fi themed interface.

## 🎯 Project Overview

This interactive web application demonstrates Singular Value Decomposition (SVD) for image compression, featuring:

- **Real-time compression** with adjustable rank parameters
- **Interactive visualizations** of singular values and error curves
- **Step-by-step explanations** of the mathematical concepts
- **Mobile-optimized interface** with touch gestures
- **Keyboard shortcuts** for power users
- **Accessibility features** for inclusive learning
- **Sci-fi themed UI** with holographic effects

## 🚀 Key Features

### Interactive Demo
- **Drag & Drop Upload**: Instant image processing
- **Real-time Compression**: Adjust rank (k) and see immediate results
- **Multiple Modes**: Grayscale and color image support
- **Visual Feedback**: Loading states and error handling

### Enhanced Interactivity
- **Step-by-Step Guide**: Interactive process explanation
- **Matrix Visualization**: Toggle between different views
- **Singular Value Charts**: Real-time bar charts and error curves
- **Compression Metrics**: File size and quality comparisons

### Mobile Optimization
- **Touch Gestures**: Swipe to adjust rank values
- **Responsive Design**: Optimized for all screen sizes
- **Touch-Friendly Controls**: Large buttons and intuitive interface
- **Mobile Help**: Gesture tutorials and quick actions

### Accessibility
- **Screen Reader Support**: Full ARIA labels and semantic HTML
- **Keyboard Navigation**: Complete keyboard accessibility
- **High Contrast Mode**: Enhanced visibility options
- **Reduced Motion**: Respects user motion preferences
- **Focus Management**: Clear focus indicators

### Power User Features
- **Keyboard Shortcuts**: Quick access to all functions
- **Real-time Feedback**: Visual confirmation of actions
- **Customizable Settings**: Personalize your experience
- **Help System**: Contextual assistance throughout

## 🛠️ Technical Stack

### Frontend
- **Next.js 14**: React framework with app router
- **TypeScript**: Type-safe development
- **TailwindCSS**: Utility-first styling
- **Framer Motion**: Smooth animations and transitions
- **Lucide React**: Beautiful icons

### Backend
- **FastAPI**: High-performance Python web framework
- **NumPy**: Numerical computing for SVD calculations
- **Pillow**: Image processing and manipulation
- **Uvicorn**: ASGI server for production

### Development Tools
- **pnpm**: Fast, disk space efficient package manager
- **Turbo**: Monorepo build system
- **ESLint**: Code quality and consistency
- **Prettier**: Code formatting

## 📁 Project Structure

```
compression-svd/
├── apps/
│   ├── web/                 # Next.js frontend
│   │   ├── app/            # App router pages
│   │   ├── components/     # React components
│   │   │   ├── svg/       # SVG visualizations
│   │   │   └── ...        # Interactive components
│   │   └── public/        # Static assets
│   └── api/               # FastAPI backend
│       └── main.py        # SVD compression API
├── packages/
│   └── ui/               # Shared UI components
├── slides/               # Presentation materials
├── handout/              # PDF handouts
└── README.md            # This file
```

## 🚀 Getting Started

### Prerequisites
- Node.js 20 LTS
- Python 3.11+
- pnpm package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd compression-svd
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   cd apps/api && poetry install
   ```

3. **Start development servers**
   ```bash
   pnpm dev
   ```

4. **Open your browser**
   - Frontend: http://localhost:3000
   - API: http://localhost:8000

## 🎮 How to Use

### Basic Usage
1. **Upload an Image**: Drag and drop or click to select an image
2. **Adjust Settings**: Choose grayscale/color and compression mode
3. **Set Rank**: Use the slider to adjust compression level (k)
4. **View Results**: See real-time compression and quality metrics

### Advanced Features

#### Keyboard Shortcuts
- `Space`: Play/pause demo animation
- `R`: Reset to step 1
- `← →`: Navigate between steps
- `↑ ↓`: Adjust rank (k) value
- `G`: Toggle grayscale/color mode
- `L`: Toggle largest/smallest mode
- `H`: Show/hide help
- `F`: Trigger file upload dialog
- `1-9`: Quick rank selection
- `0`: Set rank to maximum

#### Mobile Gestures
- **Swipe Left**: Increase rank (k)
- **Swipe Right**: Decrease rank (k)
- **Tap & Hold**: Quick rank selection
- **Pinch**: Zoom image preview
- **Double Tap**: Reset to default

#### Accessibility Features
- **Alt + A**: Open accessibility menu
- **Alt + H**: Toggle high contrast
- **Alt + R**: Toggle reduced motion
- **Alt + M**: Toggle audio feedback

## 🧮 Mathematical Foundation

### SVD Decomposition
The Singular Value Decomposition breaks any matrix A into three components:

```
A = UΣV^T
```

Where:
- **U**: Left singular vectors (orthogonal)
- **Σ**: Singular values (diagonal matrix)
- **V^T**: Right singular vectors (orthogonal)

### Rank-k Approximation
For compression, we keep only the top k singular values:

```
A_k = Σ(i=1 to k) σ_i u_i v_i^T
```

This minimizes the reconstruction error while dramatically reducing storage requirements.

### Storage Cost
- **Original**: mn numbers (m × n matrix)
- **Compressed**: k(m + n + 1) numbers
- **Example**: 256×256 image with k=30 → 15,630 vs 65,536 numbers

## 🎨 Design System

### Color Palette
- **Neon Blue**: Primary accent (#0ea5e9)
- **Plasma Purple**: Secondary accent (#d946ef)
- **Matrix Green**: Success/positive (#22c55e)
- **Quantum Yellow**: Warning/attention (#fbbf24)

### Typography
- **Headings**: Bold, neon effects
- **Body**: Clean, readable sans-serif
- **Code**: Monospace for mathematical expressions

### Animations
- **Smooth Transitions**: 60fps animations
- **Holographic Effects**: Sci-fi aesthetic
- **Responsive**: Respects user motion preferences

## 📱 Mobile Experience

### Touch Optimizations
- **Large Touch Targets**: Minimum 44px touch areas
- **Gesture Support**: Intuitive swipe and pinch gestures
- **Responsive Layout**: Adapts to all screen sizes
- **Performance**: Optimized for mobile devices

### Mobile-Specific Features
- **Touch Sliders**: Draggable rank controls
- **Quick Actions**: One-tap rank selection
- **Gesture Help**: Built-in tutorial system
- **Offline Support**: Progressive web app features

## ♿ Accessibility Features

### Screen Reader Support
- **Semantic HTML**: Proper heading structure
- **ARIA Labels**: Descriptive labels for all interactive elements
- **Alt Text**: Comprehensive image descriptions
- **Live Regions**: Dynamic content announcements

### Keyboard Navigation
- **Tab Order**: Logical navigation flow
- **Focus Indicators**: Clear visual feedback
- **Shortcuts**: Comprehensive keyboard support
- **Skip Links**: Quick navigation to main content

### Visual Accessibility
- **High Contrast**: Enhanced visibility mode
- **Reduced Motion**: Respects motion sensitivity
- **Color Blind Support**: Accessible color palette
- **Font Scaling**: Responsive text sizing

## 🔧 Development

### Code Quality
- **TypeScript**: Type-safe development
- **ESLint**: Code quality enforcement
- **Prettier**: Consistent formatting
- **Testing**: Component and integration tests

### Performance
- **Bundle Optimization**: Tree shaking and code splitting
- **Image Optimization**: Next.js image optimization
- **Caching**: Efficient data caching
- **Lazy Loading**: On-demand component loading

### Deployment
- **Static Export**: Next.js static generation
- **API Deployment**: FastAPI on cloud platforms
- **CDN**: Global content delivery
- **Monitoring**: Performance and error tracking

## 📚 Educational Value

### Learning Objectives
1. **Understand SVD**: Mathematical foundation and intuition
2. **Visualize Compression**: See the trade-off between quality and size
3. **Explore Applications**: Real-world use cases
4. **Hands-on Experience**: Interactive experimentation

### Target Audience
- **Math Students**: Linear algebra applications
- **Computer Science**: Algorithm understanding
- **General Public**: Accessible mathematical concepts
- **Researchers**: Advanced SVD applications

## 🎓 Academic Context

### Course Integration
- **MATH 3120**: Linear Algebra Final Project
- **Interactive Learning**: Replaces traditional paper
- **Real-world Applications**: Practical mathematical concepts
- **Modern Pedagogy**: Engaging digital learning

### Assessment Criteria
- **Technical Implementation**: Robust, scalable code
- **Educational Value**: Clear learning outcomes
- **User Experience**: Intuitive and accessible
- **Innovation**: Creative approach to mathematical education

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests and documentation
5. Submit a pull request

### Code Standards
- **TypeScript**: Strict type checking
- **ESLint**: Enforced code quality
- **Prettier**: Consistent formatting
- **Testing**: Comprehensive test coverage

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **MATH 3120 Faculty**: For guidance and support
- **Linear Algebra Community**: For mathematical insights
- **Open Source Contributors**: For the amazing tools used
- **Accessibility Advocates**: For inclusive design principles

---

**Built with ❤️ for mathematical education and interactive learning**

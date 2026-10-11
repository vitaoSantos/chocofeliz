import { MotionConfig } from 'motion/react'
import { Background } from './components/layout/Background'
import { Cursor } from './components/layout/Cursor'
import { Footer } from './components/layout/Footer'
import { Loader } from './components/layout/Loader'
import { Navbar } from './components/layout/Navbar'
import { SmoothScroll } from './components/layout/SmoothScroll'
import { Builder } from './components/sections/Builder'
import { Contact } from './components/sections/Contact'
import { Hero } from './components/sections/Hero'
import { HowItWorks } from './components/sections/HowItWorks'
import { Occasions } from './components/sections/Occasions'
import { Showcase } from './components/sections/Showcase'
import { IntroProvider } from './context/IntroContext'
import { OrderProvider } from './context/OrderContext'

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <IntroProvider>
        <OrderProvider>
          <SmoothScroll>
            <Background />
            <Loader />
            <Cursor />
            <Navbar />
            <main id="conteudo">
              <Hero />
              <Occasions />
              <Showcase />
              <Builder />
              <HowItWorks />
              <Contact />
            </main>
            <Footer />
          </SmoothScroll>
        </OrderProvider>
      </IntroProvider>
    </MotionConfig>
  )
}

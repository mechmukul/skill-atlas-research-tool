"use client";
import {AtlasChoice} from '@/components/atlas-choice';
import {ThemeProvider,useTheme} from 'next-themes';
import {AnimatedThemeToggler} from '@/registry/magicui/animated-theme-toggler';

export function AtlasTheme({children}:{children:React.ReactNode}){return <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="atlas-theme" disableTransitionOnChange>{children}</ThemeProvider>;}
export function ThemeToggle(){return <AnimatedThemeToggler/>;}
export function ThemeSettings(){const {theme,setTheme}=useTheme();return <section className="panel appearance-settings"><h2>Appearance</h2><p>Choose a theme for this browser. System follows your device preference.</p><AtlasChoice label="Colour theme" value={theme||"system"} onChange={setTheme} options={[{value:"light",label:"Light"},{value:"dark",label:"Dark"},{value:"system",label:"Follow system"}]}/></section>;}

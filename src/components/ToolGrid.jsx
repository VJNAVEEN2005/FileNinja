import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { categories, getToolsByCategory } from '../data/toolsData';
import ToolCard from './ToolCard';
import './ToolGrid.css';

gsap.registerPlugin(ScrollTrigger);

export default function ToolGrid() {
  const [activeCategory, setActiveCategory] = useState('all');
  const gridRef = useRef(null);
  const sectionRef = useRef(null);

  const filteredTools = getToolsByCategory(activeCategory);

  // Scroll reveal via IntersectionObserver
  useEffect(() => {
    const header = sectionRef.current?.querySelector('.tool-grid__header');
    if (!header) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { header.classList.add('visible'); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(header);
    return () => obs.disconnect();
  }, []);

  // Stagger cards on filter change
  useEffect(() => {
    if (!gridRef.current) return;
    const cards = gridRef.current.querySelectorAll('.tool-card');
    gsap.fromTo(
      cards,
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.3, stagger: 0.025, ease: 'power2.out', clearProps: 'all' }
    );
  }, [activeCategory]);

  return (
    <section className="tool-grid-section" id="tools" ref={sectionRef}>
      <div className="container">
        <div className="tool-grid__header section-reveal">
          <h2 className="section-heading">Every tool you need</h2>
          <p className="section-subheading">
            50+ professional PDF tools, all running entirely in your browser. Pick a category or browse them all.
          </p>
        </div>

        <div className="tool-grid__filters">
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`tool-grid__filter ${activeCategory === cat.id ? 'tool-grid__filter--active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
              style={activeCategory === cat.id && cat.color ? { '--filter-color': cat.color } : {}}
            >
              {cat.label}
              {cat.id !== 'all' && (
                <span className="tool-grid__filter-count">
                  {getToolsByCategory(cat.id).length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="tool-grid__grid" ref={gridRef}>
          {filteredTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </div>
    </section>
  );
}

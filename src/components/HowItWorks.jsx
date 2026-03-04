import { useEffect, useRef } from 'react';
import './HowItWorks.css';

const steps = [
  {
    number: '01',
    title: 'Upload your file',
    desc: 'Drag and drop or click to select. Your file stays in your browser the entire time.',
  },
  {
    number: '02',
    title: 'Choose your action',
    desc: 'Pick from 50+ tools. Merge, split, compress, convert, sign, and more.',
  },
  {
    number: '03',
    title: 'Download the result',
    desc: 'Processed instantly on your device. No waiting, no server queues.',
  },
];

export default function HowItWorks() {
  const sectionRef = useRef(null);

  useEffect(() => {
    if (!sectionRef.current) return;
    const els = sectionRef.current.querySelectorAll('.section-reveal');
    const obs = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } }),
      { threshold: 0.1 }
    );
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <section className="hiw" id="how-it-works" ref={sectionRef}>
      <div className="container">
        <div className="hiw__header section-reveal">
          <h2 className="section-heading">How it works</h2>
          <p className="section-subheading">
            Three steps. Zero complexity. Everything happens right in your browser.
          </p>
        </div>

        <div className="hiw__steps">
          {steps.map((step, i) => (
            <div className="hiw__step-wrapper" key={step.number}>
              <div className="hiw__step section-reveal" style={{ transitionDelay: `${i * 0.12}s` }}>
                <div className="hiw__number">{step.number}</div>
                <h3 className="hiw__title">{step.title}</h3>
                <p className="hiw__desc">{step.desc}</p>
              </div>
              {i < steps.length - 1 && <div className="hiw__connector"></div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

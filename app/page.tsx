import Calculator from '@/components/Calculator/Calculator';

export const metadata = { title: 'Concreto y Equipos de Juárez', description: 'Cotiza concreto al instante' };

export default function Page(){
  return (
    <main>
      <section className="hero-section">
        <h1>Concreto listo para tus obras</h1>
        <p>Entrega puntual en Ciudad Juárez, Chihuahua.</p>
      </section>
      <Calculator />
    </main>
  );
}

const About = () => {
  return (
    <div className="min-h-screen flex items-center py-8 px-8">
      <div className="max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left side - Text content */}
          <div className="space-y-6">
            <h1 className="text-2xl mb-4 tracking-[0.2em] uppercase">ANDO JV</h1>
            
            <div className="space-y-3 text-xs leading-relaxed">
              <p className="text-muted-foreground">
                — это российский бренд концептуальной одежды на каждый день, 
                основанный двумя дизайнерами: Анзыловой Екатериной и Долгушиной Екатериной. 
                ANDO JV сочетает в себе традиции и современность японской культуры, 
                предлагая изделия, идеально подходящие как для городской жизни, 
                так и для отдыха на природе.
              </p>

              <p className="text-muted-foreground">
                В стиле ANDO JV отражено видение двух дизайнеров, где соединяются 
                минимализм и изысканные детали в виде асимметрии, смешения фактур, 
                форм, текстур и цвета.
              </p>

              <p className="text-muted-foreground">
                Мы создаем капсульные коллекции с возможностью сочетать как с другими 
                вещами бренда, так и с существующими айтемами гардероба.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-4">
              <section>
                <h2 className="text-sm mb-2 tracking-[0.15em] uppercase">Философия</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Осознанное потребление и внимание к деталям. Качественные натуральные материалы и проверенные производители.
                </p>
              </section>

              <section>
                <h2 className="text-sm mb-2 tracking-[0.15em] uppercase">Производство</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Все изделия производятся в России с соблюдением высоких стандартов качества.
                </p>
              </section>
            </div>

            <section className="pt-4 border-t border-border">
              <h2 className="text-sm mb-2 tracking-[0.15em] uppercase">Контакты</h2>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>Email: hello@jnby.com.ru</p>
                <p>Телефон: +7 (921) 909-39-67</p>
              </div>
            </section>
          </div>

          {/* Right side - Founder photo */}
          <div>
            <div className="aspect-[3/4] overflow-hidden bg-muted">
              <img
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80"
                alt="Основатели бренда"
                className="w-full h-full object-cover grayscale"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;

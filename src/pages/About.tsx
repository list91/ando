const About = () => {
  return (
    <div className="min-h-full py-20 px-16">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Left side - Text content */}
          <div>
            <h1 className="text-3xl mb-12 tracking-[0.2em] uppercase">ANDO JV</h1>
            
            <div className="space-y-8 text-sm leading-relaxed">
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

              <p className="text-muted-foreground">
                Наша миссия – пробудить желание быть в настоящем моменте и уметь 
                видеть красоту повседневности в мелочах, наслаждаться ими и быть 
                в гармонии. Чтобы внутренний мир отражался и во вне.
              </p>
            </div>
          </div>

          {/* Right side - Founder photo */}
          <div className="lg:sticky lg:top-24">
            <div className="aspect-[3/4] overflow-hidden bg-muted">
              <img
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80"
                alt="Основатели бренда"
                className="w-full h-full object-cover grayscale"
              />
            </div>
          </div>
        </div>

        {/* Bottom sections */}
        <div className="mt-20 max-w-2xl">
          <section className="mb-12">
            <h2 className="text-xl mb-6 tracking-[0.15em] uppercase">Философия</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              В основе бренда лежит идея осознанного потребления и внимания к деталям. 
              Мы используем только качественные натуральные материалы и работаем с проверенными производителями.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Каждая коллекция — это отражение момента, настроения, стремления к гармонии 
              между внутренним состоянием и внешним выражением.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-xl mb-6 tracking-[0.15em] uppercase">Производство</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Все изделия производятся в России с соблюдением высоких стандартов качества. 
              Мы контролируем каждый этап создания одежды — от выбора тканей до финальной отделки, 
              чтобы гарантировать безупречный результат.
            </p>
          </section>

          <section className="pt-8 border-t border-border">
            <h2 className="text-xl mb-6 tracking-[0.15em] uppercase">Контакты</h2>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Email: hello@jnby.com.ru</p>
              <p>Телефон: +7 (921) 909-39-67</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default About;

import { useInfoPages } from "@/hooks/useInfoPages";
import { Loader2 } from "lucide-react";

interface InfoProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const Info = ({ activeSection }: InfoProps) => {
  const { data: pages, isLoading } = useInfoPages();
  const visiblePages = pages?.filter(p => p.is_visible);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Try to find the active page from database
  const activePage = visiblePages?.find(p => p.page_key === activeSection);
  return (
    <div className="flex-1 py-20 px-16 max-w-4xl min-h-full">
      {activePage ? (
        <div className="space-y-8">
          <h2 className="text-2xl mb-6 tracking-[0.15em] uppercase">{activePage.title}</h2>
          <div 
            className="text-sm leading-relaxed whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: activePage.content }}
          />
        </div>
      ) : (
        <>
          {/* Keep old static content as fallback */}
        {activeSection === "brand" && (
          <div className="space-y-8">
            <h2 className="text-2xl mb-6 tracking-[0.15em] uppercase">О Бренде</h2>
            <p className="text-sm leading-relaxed">
              ANDO JV — российский бренд современной одежды, созданный для тех, кто ценит минимализм, 
              качество и индивидуальность. Каждая вещь разрабатывается с вниманием к деталям и комфорту, 
              отражая философию бренда: «Feel the moment».
            </p>
            <p className="text-sm leading-relaxed">
              Мы создаем коллекции, которые легко интегрируются в повседневный гардероб, 
              подчеркивая уникальность каждого человека.
            </p>
          </div>
        )}

        {activeSection === "cooperation" && (
          <div className="space-y-8">
            <h2 className="text-2xl mb-6 tracking-[0.15em] uppercase">Сотрудничество</h2>
            <p className="text-sm leading-relaxed">
              Мы открыты к сотрудничеству с мультибрендовыми магазинами, шоурумами и онлайн-платформами.
            </p>
            <p className="text-sm leading-relaxed">
              Для получения информации о партнерских условиях и оптовых закупках, пожалуйста, 
              свяжитесь с нами по электронной почте: hello@jnby.com.ru
            </p>
            <div className="pt-6 space-y-2">
              <p className="text-sm">Email: hello@jnby.com.ru</p>
              <p className="text-sm">Телефон: +7 (921) 909-39-67</p>
            </div>
          </div>
        )}

        {activeSection === "delivery" && (
          <div className="space-y-12">
            <section>
              <h2 className="text-2xl mb-6 tracking-[0.15em] uppercase">ДОСТАВКА</h2>
              <p className="text-sm mb-4 leading-relaxed">
                Доставка всех заказов по России бесплатная.
              </p>
              <p className="text-sm mb-4 leading-relaxed">
                Доставка по России осуществляется курьерской службой <span className="underline">СДЭК</span>. 
                Срок по Санкт-Петербургу и Москве составляет 1-3 рабочих дня, по России до 7 рабочих дней.
              </p>
              <p className="text-sm mb-4 leading-relaxed">
                По Санкт-Петербургу и Москве (при наличии оплаченных вещей на складе) доставка 
                осуществляется курьерами службы <span className="underline">Dostavista</span> и может быть организована на следующий день 
                оформления заказа.
              </p>
              <p className="text-sm mb-4 leading-relaxed">
                Действует международная доставка компанией <span className="underline">EMS</span>. 
                Срок доставки составляет от 7 дней. Стоимость 1500 рублей.
              </p>
              <div className="pt-6">
                <p className="text-sm">+7 (921) 909-39-67</p>
                <p className="text-sm">hello@jnby.com.ru</p>
              </div>
            </section>

            <section className="pt-8 border-t border-border">
              <h2 className="text-2xl mb-6 tracking-[0.15em] uppercase">ОПЛАТА</h2>
              <p className="text-sm mb-4 leading-relaxed">
                К оплате принимаются карты VISA, MasterCard, Платежная система «Мир».
              </p>
              <p className="text-sm mb-4 leading-relaxed">
                Платежи проводятся через систему CloudPayments.
              </p>
              <p className="text-sm leading-relaxed">
                CloudPayments — международная процессинговая компания, которая сотрудничает с крупнейшими 
                мировыми и российскими системами онлайн-платежей.
              </p>
            </section>
          </div>
        )}

        {activeSection === "returns" && (
          <div className="space-y-8">
            <h2 className="text-2xl mb-6 tracking-[0.15em] uppercase">Возврат</h2>
            <p className="text-sm leading-relaxed">
              Мы принимаем возврат товаров надлежащего качества в течение 14 дней с момента получения заказа.
            </p>
            <p className="text-sm leading-relaxed">
              Для оформления возврата необходимо связаться с нами по электронной почте hello@jnby.com.ru 
              или по телефону +7 (921) 909-39-67.
            </p>
            <div className="pt-4">
              <h3 className="text-lg mb-4 tracking-wide">Условия возврата:</h3>
              <ul className="space-y-2 text-sm list-disc list-inside text-muted-foreground">
                <li>Товар не был в употреблении</li>
                <li>Сохранены все ярлыки и бирки</li>
                <li>Товар сохранил товарный вид и потребительские свойства</li>
                <li>Имеется документ, подтверждающий факт покупки</li>
              </ul>
            </div>
            <p className="text-sm leading-relaxed pt-4">
              Возврат денежных средств осуществляется в течение 10 рабочих дней на карту, 
              с которой была произведена оплата.
            </p>
          </div>
        )}

        {activeSection === "size-guide" && (
          <div className="space-y-8">
            <h2 className="text-2xl mb-6 tracking-[0.15em] uppercase">Гид по размерам</h2>
            <p className="text-sm leading-relaxed mb-6">
              Все наши изделия имеют свободный крой. Мы рекомендуем выбирать ваш обычный размер 
              для комфортной посадки.
            </p>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-border">
                <thead className="bg-secondary">
                  <tr>
                    <th className="border border-border px-4 py-3 text-left">Размер</th>
                    <th className="border border-border px-4 py-3 text-left">Обхват груди (см)</th>
                    <th className="border border-border px-4 py-3 text-left">Обхват талии (см)</th>
                    <th className="border border-border px-4 py-3 text-left">Обхват бедер (см)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-border px-4 py-3">S</td>
                    <td className="border border-border px-4 py-3">82-86</td>
                    <td className="border border-border px-4 py-3">62-66</td>
                    <td className="border border-border px-4 py-3">88-92</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-4 py-3">M</td>
                    <td className="border border-border px-4 py-3">86-90</td>
                    <td className="border border-border px-4 py-3">66-70</td>
                    <td className="border border-border px-4 py-3">92-96</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-4 py-3">L</td>
                    <td className="border border-border px-4 py-3">90-94</td>
                    <td className="border border-border px-4 py-3">70-74</td>
                    <td className="border border-border px-4 py-3">96-100</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-sm leading-relaxed pt-4 text-muted-foreground">
              Если у вас возникли вопросы по подбору размера, свяжитесь с нами: hello@jnby.com.ru
            </p>
          </div>
        )}

        {activeSection === "agreement" && (
          <div className="space-y-8">
            <h2 className="text-2xl mb-6 tracking-[0.15em] uppercase">Пользовательское соглашение</h2>
            <p className="text-sm leading-relaxed">
              Настоящее Пользовательское соглашение регулирует отношения между администрацией 
              интернет-магазина ANDO JV и пользователями сайта.
            </p>
            <div className="space-y-4 text-sm">
              <div>
                <h3 className="font-medium mb-2">1. Общие положения</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Использование сайта означает согласие с настоящим пользовательским соглашением. 
                  Если вы не согласны с условиями, пожалуйста, покиньте сайт.
                </p>
              </div>
              <div>
                <h3 className="font-medium mb-2">2. Конфиденциальность</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Мы гарантируем конфиденциальность персональных данных пользователей. 
                  Информация используется только для обработки заказов.
                </p>
              </div>
              <div>
                <h3 className="font-medium mb-2">3. Обязательства сторон</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Покупатель обязуется предоставить достоверную информацию при оформлении заказа. 
                  Продавец обязуется предоставить товар надлежащего качества.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeSection === "warranty" && (
          <div className="space-y-8">
            <h2 className="text-2xl mb-6 tracking-[0.15em] uppercase">Гарантия</h2>
            <p className="text-sm leading-relaxed">
              Мы гарантируем высокое качество всех изделий ANDO JV. Каждая вещь проходит тщательный 
              контроль качества перед отправкой покупателю.
            </p>
            <p className="text-sm leading-relaxed">
              В случае обнаружения производственного брака в течение 14 дней с момента получения заказа, 
              мы произведем обмен товара или вернем денежные средства.
            </p>
            <div className="pt-4 space-y-2 text-sm">
              <h3 className="font-medium mb-3">Гарантия не распространяется на:</h3>
              <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                <li>Механические повреждения, полученные в процессе эксплуатации</li>
                <li>Повреждения, возникшие в результате неправильного ухода</li>
                <li>Естественный износ изделия</li>
              </ul>
            </div>
          </div>
        )}

        {activeSection === "loyalty" && (
          <div className="space-y-8">
            <h2 className="text-2xl mb-6 tracking-[0.15em] uppercase">Программа лояльности</h2>
            <p className="text-sm leading-relaxed">
              Для наших постоянных клиентов мы разрабатываем специальную программу лояльности.
            </p>
            <p className="text-sm leading-relaxed">
              Следите за новостями в наших социальных сетях и на сайте — скоро вы сможете 
              получать бонусы за покупки, участвовать в закрытых распродажах и получать 
              эксклюзивные предложения.
            </p>
            <p className="text-sm leading-relaxed pt-4">
              Подпишитесь на нашу рассылку, чтобы первыми узнавать о запуске программы лояльности: 
              hello@jnby.com.ru
            </p>
          </div>
        )}

        {activeSection === "contacts" && (
          <div className="space-y-8">
            <h2 className="text-2xl mb-6 tracking-[0.15em] uppercase">Контакты</h2>
            <div className="space-y-6 text-sm">
              <div>
                <h3 className="font-medium mb-3">Служба поддержки</h3>
                <div className="space-y-2 text-muted-foreground">
                  <p>Email: hello@jnby.com.ru</p>
                  <p>Телефон: +7 (921) 909-39-67</p>
                  <p>Время работы: Пн-Пт с 10:00 до 19:00 (МСК)</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-3">Юридический адрес</h3>
                <p className="text-muted-foreground">
                  192522, Санкт-Петербург, ул. Карпинского, 32 лит А, пом 7-н.
                </p>
              </div>

              <div>
                <h3 className="font-medium mb-3">Фактический адрес</h3>
                <p className="text-muted-foreground">
                  191025, Санкт-Петербург, Невский пр., 148, пом 3-н
                </p>
              </div>
            </div>
          </div>
        )}

        {activeSection === "stores" && (
          <div className="space-y-8">
            <h2 className="text-2xl mb-6 tracking-[0.15em] uppercase">Магазины</h2>
            <p className="text-sm leading-relaxed mb-8">
              В настоящее время ANDO JV представлен в онлайн-формате. 
              Мы работаем над открытием офлайн-точек в крупных городах России.
            </p>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-3">Санкт-Петербург (скоро)</h3>
                <p className="text-sm text-muted-foreground">
                  Невский проспект, 148<br />
                  Время работы: 11:00 - 21:00
                </p>
              </div>

              <div>
                <h3 className="font-medium mb-3">Москва (планируется)</h3>
                <p className="text-sm text-muted-foreground">
                  Информация уточняется
                </p>
              </div>
            </div>

            <p className="text-sm leading-relaxed pt-8 text-muted-foreground">
              Следите за обновлениями на нашем сайте и в социальных сетях.
            </p>
          </div>
        )}

        {!["brand", "cooperation", "delivery", "returns", "size-guide", "agreement", "warranty", "loyalty", "contacts", "stores"].includes(activeSection) && (
          <div className="space-y-12">
            <section className="pt-8 border-t border-border">
              <h2 className="text-2xl mb-6 tracking-[0.15em] uppercase">РЕКВИЗИТЫ</h2>
              <div className="text-sm space-y-2 text-muted-foreground">
                <p>ООО «Красивый бизнес»</p>
                <p className="mt-4">
                  Юридический адрес: 192522, Санкт-Петербург, ул. Карпинского, 32 лит А, пом 7-н.
                </p>
                <p>
                  Фактический адрес: 191025, Санкт-Петербург, Невский пр., 148, пом 3-н
                </p>
                <p>Телефон/факс: 8 (812) 309-30-67, 8 (812) 905-67-11</p>
                <p className="mt-4">ИНН/КПП 7804418120 / 780401001</p>
                <p>ОКПО 971 52 67</p>
                <p>ОГРН 1097847185798</p>
                <p>ОКПО 40328000</p>
                <p>Расчетный счет № 40702810232060002291</p>
                <p>БИК 044030786</p>
                <p>Корреспондентский счет № 30101810800000000786</p>
                <p>ОАО "АЛЬФА-БАНК", Филиал «Санкт-Петербургский»</p>
                <p className="mt-4">Генеральный директор Косицына Вера Олеговна</p>
              </div>
            </section>
          </div>
        )}
        </>
      )}
    </div>
  );
};

export default Info;

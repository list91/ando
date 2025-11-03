import { Link } from "react-router-dom";
import { Instagram, Send } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const Footer = () => {
  const { data: settings } = useSiteSettings();
  
  const getSetting = (key: string, defaultValue: any = '') => {
    const setting = settings?.find(s => s.key === key);
    return setting?.value || defaultValue;
  };

  const instagramUrl = getSetting('social_instagram', 'https://instagram.com');
  const telegramUrl = getSetting('social_telegram', 'https://t.me');
  const vkUrl = getSetting('social_vk', 'https://vk.com');
  const contactEmail = getSetting('contact_email', 'hello@jnby.com.ru');
  const contactPhone = getSetting('contact_phone', '+7 (921) 909-39-67');
  const contactAddress = getSetting('contact_address', '192522, Санкт-Петербург');

  return (
    <footer className="border-t border-border bg-background">
      <div className="max-w-7xl mx-auto px-16 py-16">
        <div className="grid grid-cols-4 gap-12">
          {/* Brand Section */}
          <div>
            <Link to="/" className="inline-block mb-6">
              <div className="border border-foreground p-3 text-center w-20">
                <div className="text-lg font-light tracking-[0.2em]">AN</div>
                <div className="text-lg font-light tracking-[0.2em]">DO</div>
                <div className="w-full h-[1px] bg-foreground my-1" />
                <div className="text-[10px] tracking-[0.3em]">JV</div>
              </div>
            </Link>
            <p className="text-sm leading-relaxed text-muted-foreground mb-6">
              Минималистичная детская мода, созданная с заботой о комфорте и стиле. 
              Качественные материалы и продуманный дизайн.
            </p>
            <div className="flex gap-4">
              {instagramUrl && (
                <a 
                  href={instagramUrl}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 border border-border flex items-center justify-center hover:border-foreground transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {telegramUrl && (
                <a 
                  href={telegramUrl}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 border border-border flex items-center justify-center hover:border-foreground transition-colors"
                  aria-label="Telegram"
                >
                  <Send className="w-4 h-4" />
                </a>
              )}
              {vkUrl && (
                <a 
                  href={vkUrl}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 border border-border flex items-center justify-center hover:border-foreground transition-colors"
                  aria-label="VKontakte"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.785 16.241s.288-.032.436-.194c.136-.148.132-.427.132-.427s-.02-1.304.572-1.497c.583-.19 1.332 1.26 2.127 1.818.6.422 1.056.329 1.056.329l2.123-.03s1.11-.07.584-.963c-.043-.073-.308-.663-1.588-1.876-1.34-1.27-1.16-1.065.453-3.263.983-1.34 1.375-2.158 1.252-2.508-.117-.334-.84-.246-.84-.246l-2.39.015s-.177-.025-.308.056c-.128.079-.21.263-.21.263s-.377 1.025-.88 1.897c-1.06 1.836-1.484 1.933-1.658 1.818-.405-.267-.304-1.075-.304-1.648 0-1.792.265-2.54-.517-2.732-.26-.064-.452-.106-1.118-.113-.854-.009-1.577.003-1.988.208-.273.137-.484.441-.355.458.159.022.52.1.711.365.247.343.238 1.113.238 1.113s.142 2.11-.331 2.372c-.325.18-.77-.187-1.726-1.865-.49-.849-.86-1.787-.86-1.787s-.071-.178-.198-.274c-.154-.116-.37-.153-.37-.153l-2.271.015s-.341.01-.466.161c-.111.134-.009.411-.009.411s1.78 4.257 3.795 6.403c1.85 1.968 3.95 1.838 3.95 1.838h.953z"/>
                  </svg>
                </a>
              )}
            </div>
          </div>

          {/* Buyers Column */}
          <div>
            <h3 className="text-sm font-medium mb-6 tracking-wide uppercase">Покупателям</h3>
            <nav className="space-y-3">
              <Link to="/info?section=size-guide" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Размерная сетка
              </Link>
              <Link to="/info?section=delivery" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Доставка и оплата
              </Link>
              <Link to="/info?section=returns" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Возврат и обмен
              </Link>
              <Link to="/catalog" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Уход за изделиями
              </Link>
              <Link to="/info?section=loyalty" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Программа лояльности
              </Link>
            </nav>
          </div>

          {/* About Company Column */}
          <div>
            <h3 className="text-sm font-medium mb-6 tracking-wide uppercase">О компании</h3>
            <nav className="space-y-3">
              <Link to="/about" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                О бренде
              </Link>
              <Link to="/info?section=cooperation" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Наша команда
              </Link>
              <Link to="/info?section=cooperation" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Вакансии
              </Link>
              <Link to="/lookbook" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Новости
              </Link>
              <Link to="/info?section=contacts" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Пресс-центр
              </Link>
            </nav>
          </div>

          {/* Help Column */}
          <div>
            <h3 className="text-sm font-medium mb-6 tracking-wide uppercase">Помощь</h3>
            <nav className="space-y-3">
              <Link to="/info" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Частые вопросы
              </Link>
              <Link to="/info?section=contacts" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Связаться с нами
              </Link>
              <Link to="/info?section=contacts" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Техподдержка
              </Link>
              <Link to="/info" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Отзывы
              </Link>
              <Link to="/catalog" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Карта сайта
              </Link>
            </nav>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-border flex justify-between items-center text-xs text-muted-foreground">
          <div>
            <p className="mb-1">© 2025 ANDO JV. Все права защищены.</p>
            <p className="text-[10px]">Не является публичной офертой.</p>
          </div>
          <div className="flex gap-6">
            <Link to="/info?section=agreement" className="hover:text-foreground transition-colors">
              Пользовательское соглашение
            </Link>
            <Link to="/info?section=agreement" className="hover:text-foreground transition-colors">
              Политика конфиденциальности
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

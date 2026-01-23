import { useState } from "react";
import { X, Send } from "lucide-react";

type ChatState = "closed" | "chat" | "contact-form" | "success";

export function SupportChat() {
  const [state, setState] = useState<ChatState>("closed");
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSendMessage = () => {
    if (!message.trim()) return;
    setState("contact-form");
  };

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim()) return;

    setIsSubmitting(true);
    try {
      await fetch("https://andojv.com/send-support.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
        }),
      });
      setState("success");
      setTimeout(() => {
        setMessage("");
        setName("");
        setEmail("");
      }, 500);
    } catch (error) {
      console.error("Failed to send support message:", error);
      setState("success");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setState("closed");
    setTimeout(() => {
      setMessage("");
      setName("");
      setEmail("");
    }, 300);
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      action();
    }
  };

  // Floating button
  // Mobile & Desktop: right bottom
  if (state === "closed") {
    return (
      <button
        onClick={() => setState("chat")}
        className="hidden md:flex fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg hover:scale-110 transition-transform duration-200 overflow-hidden items-center justify-center"
        aria-label="Открыть чат поддержки"
      >
        <img
          src="/support-icon.png"
          alt="Поддержка"
          className="w-full h-full object-cover"
        />
      </button>
    );
  }

  return (
    <>
      {/* Backdrop for mobile */}
      <div
        className="fixed inset-0 bg-black/30 z-40 md:hidden animate-in fade-in duration-200"
        onClick={handleClose}
      />

      {/* Chat window */}
      {/* Mobile: bottom sheet full width | Desktop: popup right bottom */}
      <div className="fixed z-50
        bottom-0 left-0 right-0 md:bottom-6 md:left-auto md:right-6
        w-full md:w-[360px] md:max-w-[calc(100vw-2rem)]
        animate-in slide-in-from-bottom duration-300">
        <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] md:max-h-[500px]">
          {/* Header */}
          <div className="bg-neutral-900 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/support-logo.png"
                alt="ANDO JV"
                className="h-6 object-contain brightness-0 invert"
              />
            </div>
            <button
              onClick={handleClose}
              className="text-white/70 hover:text-white transition-colors"
              aria-label="Закрыть чат"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            {state === "chat" && (
              <div className="space-y-3">
                {/* Welcome message */}
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                    <img
                      src="/support-icon.png"
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                      <p className="font-medium text-sm mb-1">ANDO JV</p>
                      <p className="text-sm text-gray-700">
                        Здравствуйте! :) Мы готовы ответить на любой ваш вопрос.
                      </p>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1 ml-2">
                      Используя чат, вы соглашаетесь с нашей политикой обработки персональных данных.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {state === "contact-form" && (
              <div className="space-y-4">
                {/* User's message shown */}
                <div className="flex justify-end">
                  <div className="bg-neutral-900 text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%]">
                    <p className="text-sm">{message}</p>
                  </div>
                </div>

                {/* Contact form request */}
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                    <img
                      src="/support-icon.png"
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex-1">
                    <p className="text-sm text-gray-700 mb-3">
                      Чтобы мы могли вам ответить, укажите ваши контакты:
                    </p>
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Ваше имя"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyPress={(e) => handleKeyPress(e, handleSubmit)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                        autoFocus
                      />
                      <input
                        type="email"
                        placeholder="Ваш email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyPress={(e) => handleKeyPress(e, handleSubmit)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                      />
                      <button
                        onClick={handleSubmit}
                        disabled={!name.trim() || !email.trim() || isSubmitting}
                        className="w-full py-2 bg-neutral-900 text-white text-sm rounded-lg hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isSubmitting ? "Отправка..." : "Отправить"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {state === "success" && (
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                  <img
                    src="/support-icon.png"
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <p className="font-medium text-sm mb-1">ANDO JV</p>
                  <p className="text-sm text-gray-700">
                    Благодарим за вопрос! Мы обработаем ваш запрос и ответим вам по почте в течение 24 часов.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Input area - only show in chat state */}
          {state === "chat" && (
            <div className="p-3 border-t border-gray-100 bg-white safe-area-bottom">
              <div className="flex gap-2 items-end">
                <input
                  type="text"
                  placeholder="Введите текст"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, handleSendMessage)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  autoFocus
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Отправить"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

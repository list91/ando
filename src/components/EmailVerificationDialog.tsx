import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface EmailVerificationDialogProps {
  open: boolean;
  email: string;
  onVerified: () => void;
  onCancel: () => void;
}

export function EmailVerificationDialog({
  open,
  email,
  onVerified,
  onCancel,
}: EmailVerificationDialogProps) {
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const { verifyEmailCode } = useAuth();
  const { toast } = useToast();

  const handleVerify = async () => {
    if (code.length !== 6) {
      toast({
        title: "Ошибка",
        description: "Введите 6-значный код",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);

    const { error } = await verifyEmailCode(email, code);

    setIsVerifying(false);

    if (error) {
      toast({
        title: "Ошибка подтверждения",
        description: error.message || "Неверный код. Попробуйте еще раз.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Успешно!",
      description: "Ваша почта подтверждена",
    });

    onVerified();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Подтверждение почты</DialogTitle>
          <DialogDescription>
            На <strong>{email}</strong> отправлен код подтверждения
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-4">
          <InputOTP
            maxLength={6}
            value={code}
            onChange={(value) => setCode(value)}
            disabled={isVerifying}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>

          <p className="text-sm text-muted-foreground text-center">
            Введите 6-значный код из письма
          </p>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isVerifying}
          >
            Отмена
          </Button>
          <Button
            type="button"
            onClick={handleVerify}
            disabled={isVerifying || code.length !== 6}
          >
            {isVerifying ? "Проверка..." : "Подтвердить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

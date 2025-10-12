import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AboutPageSection {
  id: string;
  section_key: string;
  title: string | null;
  content: string | null;
  image_url: string | null;
  display_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export const useAboutPage = () => {
  return useQuery({
    queryKey: ["about-page"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("about_page")
        .select("*")
        .eq("is_visible", true)
        .order("display_order");

      if (error) throw error;
      return data as AboutPageSection[];
    },
  });
};

export const useUpdateAboutSection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<AboutPageSection>;
    }) => {
      const { data, error } = await supabase
        .from("about_page")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["about-page"] });
      toast.success("Изменения сохранены");
    },
    onError: (error) => {
      console.error("Error updating about section:", error);
      toast.error("Ошибка при сохранении");
    },
  });
};

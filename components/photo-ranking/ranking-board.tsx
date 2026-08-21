"use client";

import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import ImageLightbox from "@/components/photo-ranking/image-lightbox";

type RankingImage = {
  id: number;
  signedUrl: string | null;
};

type RankingBoardProps = {
  images: RankingImage[];
  challengeId: number;
  active: boolean;
};

type SortableImageProps = {
  image: RankingImage;
  index: number;
  disabled: boolean;
  onImageClick: (image: RankingImage) => void;
};

function SortableImage({
  image,
  index,
  disabled,
  onImageClick,
}: SortableImageProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: image.id,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: "none",
    willChange: isDragging ? "transform" : "auto",
  };

  const positionStyle =
    index === 0
      ? "border-yellow-500/30 bg-yellow-500/[0.05]"
      : index === 1
        ? "border-slate-400/20 bg-white/[0.04]"
        : index === 2
          ? "border-orange-500/20 bg-orange-500/[0.04]"
          : "border-white/10 bg-white/[0.03]";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onContextMenu={(event) => event.preventDefault()}
      className={`group overflow-hidden rounded-2xl border select-none backdrop-blur transition ${
        disabled
          ? "cursor-default"
          : "cursor-grab active:cursor-grabbing hover:border-purple-500/30 hover:bg-white/[0.05]"
      } ${positionStyle} ${
        isDragging
          ? "z-10 scale-[0.98] opacity-60 shadow-2xl shadow-purple-500/20"
          : "opacity-100"
      }`}
    >
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">
            {index === 0
              ? "🥇"
              : index === 1
                ? "🥈"
                : index === 2
                  ? "🥉"
                  : "📷"}
          </span>

          <span className="font-bold">
            {index + 1}. hely
          </span>
        </div>

        {!disabled && (
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs text-muted-foreground">
            ↕ Húzd
          </span>
        )}
      </div>

      {image.signedUrl ? (
        <button
          type="button"
          onPointerDown={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
          onTouchStart={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onImageClick(image);
          }}
          className="block w-full cursor-zoom-in"
          aria-label={`${index + 1}. helyezett kép megnyitása nagyban`}
        >
          <img
            src={image.signedUrl}
            alt={`${index + 1}. helyezett kép`}
            draggable={false}
            loading={index < 6 ? "eager" : "lazy"}
            decoding="async"
            fetchPriority={index < 3 ? "high" : "low"}
            onContextMenu={(event) => event.preventDefault()}
            className="aspect-square w-full select-none object-cover"
          />
        </button>
      ) : (
        <div className="flex aspect-square items-center justify-center text-sm text-muted-foreground">
          A kép nem tölthető be
        </div>
      )}

      {!disabled && (
        <div className="border-t border-white/10 px-4 py-2 text-center text-xs text-muted-foreground">
          Húzd a kívánt helyre
        </div>
      )}
    </div>
  );
}

export default function RankingBoard({
  images,
  challengeId,
  active,
}: RankingBoardProps) {
  const [items, setItems] = useState(images);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [checkingVote, setCheckingVote] = useState(true);
  const [lightboxImage, setLightboxImage] = useState<RankingImage | null>(
    null
  );

  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;

    async function checkExistingVote() {
      setCheckingVote(true);

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          return;
        }

        const { data: existingRankings, error } =
          await supabase
            .from("rankings")
            .select("image_id, position")
            .eq("challenge_id", challengeId)
            .eq("user_id", user.id)
            .order("position", { ascending: true });

        if (error) {
          console.error(
            "Hiba a korábbi szavazat ellenőrzésekor:",
            error
          );
          return;
        }

        if (
          !cancelled &&
          existingRankings &&
          existingRankings.length === images.length &&
          images.length > 0
        ) {
          const savedOrder = existingRankings
            .map((ranking) =>
              images.find(
                (image) => image.id === ranking.image_id
              )
            )
            .filter(
              (image): image is RankingImage =>
                image !== undefined
            );

          if (savedOrder.length === images.length) {
            setItems(savedOrder);
            setSubmitted(true);
          }
        }
      } finally {
        if (!cancelled) {
          setCheckingVote(false);
        }
      }
    }

    checkExistingVote();

    return () => {
      cancelled = true;
    };
  }, [challengeId, images, supabase]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    if (!active || submitted || saving || checkingVote) {
      return;
    }

    const { active: draggedItem, over } = event;

    if (!over || draggedItem.id === over.id) {
      return;
    }

    const oldIndex = items.findIndex(
      (image) => image.id === draggedItem.id
    );

    const newIndex = items.findIndex(
      (image) => image.id === over.id
    );

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const newOrder = [...items];
    const [movedImage] = newOrder.splice(oldIndex, 1);

    newOrder.splice(newIndex, 0, movedImage);

    setItems(newOrder);
  }

  async function handleSubmit() {
    if (!active || submitted || saving || checkingVote) {
      return;
    }

    setSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("A szavazáshoz be kell jelentkezned.");
        return;
      }

      const rankings = items.map((image, index) => ({
        image_id: image.id,
        position: index + 1,
      }));

      const { error } = await supabase.rpc("submit_vote", {
        p_challenge_id: challengeId,
        p_rankings: rankings,
      });

      if (error) {
        if (
          error.message.toLowerCase().includes("duplicate") ||
          error.message.toLowerCase().includes("unique")
        ) {
          setSubmitted(true);
          alert(
            "Erre a szavazásra már leadtad a szavazatodat."
          );
          return;
        }

        throw error;
      }

      setSubmitted(true);
      alert("A szavazatodat sikeresen elmentettük!");
    } catch (error) {
      console.error(
        "Hiba a szavazat mentésekor:",
        error
      );
      alert("Hiba történt a szavazat mentésekor.");
    } finally {
      setSaving(false);
    }
  }

  const boardDisabled =
    !active || submitted || saving || checkingVote;

  return (
    <div className="mt-10">
      {/* Segítő üzenet */}
      <div
        className={`rounded-2xl border p-4 ${
          submitted
            ? "border-emerald-500/20 bg-emerald-500/[0.06]"
            : "border-purple-500/20 bg-purple-500/[0.05]"
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="text-xl">
            {submitted ? "✅" : "💡"}
          </div>

          <div>
            <p className="font-semibold">
              {submitted
                ? "A szavazatod már leadásra került"
                : "Rangsorold a képeket"}
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              {submitted
                ? "A korábban leadott sorrended látható."
                : "Fogd meg a képeket, és húzd őket a kedvencedtől a legkevésbé kedveltig."}
            </p>
          </div>
        </div>
      </div>

      {/* Loading */}
      {checkingVote ? (
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-purple-500" />

          <p className="mt-4 text-sm text-muted-foreground">
            Korábbi szavazat ellenőrzése...
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items.map((image) => image.id)}
            strategy={rectSortingStrategy}
          >
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((image, index) => (
                <SortableImage
                  key={image.id}
                  image={image}
                  index={index}
                  disabled={boardDisabled}
                  onImageClick={setLightboxImage}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Szavazás leadása */}
      <div className="mt-10 flex justify-center">
        {!active ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-6 py-3 font-semibold text-muted-foreground">
            🔒 Szavazás lezárva
          </div>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={
              saving ||
              submitted ||
              checkingVote
            }
            className={`min-w-64 rounded-xl px-7 py-3.5 font-semibold text-white shadow-lg transition ${
              submitted
                ? "bg-emerald-600/80 shadow-emerald-500/10"
                : "bg-gradient-to-r from-purple-600 to-blue-600 shadow-purple-500/20 hover:from-purple-500 hover:to-blue-500"
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {submitted
              ? "✓ Szavazat leadva"
              : saving
                ? "Szavazat mentése..."
                : checkingVote
                  ? "Ellenőrzés..."
                  : "Szavazat leadása →"}
          </button>
        )}
      </div>

      {lightboxImage?.signedUrl && (
        <ImageLightbox
          imageUrl={lightboxImage.signedUrl}
          alt="Nagyított kép"
          onClose={() => setLightboxImage(null)}
        />
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createProductAction,
  updateProductAction,
  uploadProductImageAction,
} from "@/app/actions/admin/products";
import { slugify } from "@/lib/admin/utils";
import { useToast } from "@/components/admin/ToastProvider";
import {
  AdminField,
  AdminFormSection,
  AdminPrimaryButton,
  adminInputClass,
} from "@/components/admin/AdminUI";
import type { Product } from "@/lib/types";

type ProductFormProps = {
  product?: Product;
  categories: string[];
};

export function ProductForm({ product, categories }: ProductFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(product));
  const [features, setFeatures] = useState<string[]>(
    product?.features?.length ? product.features : [""],
  );
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugEdited) setSlug(slugify(value));
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.set("file", file);
    const result = await uploadProductImageAction(fd);
    setUploading(false);
    if (result.success) {
      setImages((prev) => [...prev, result.url]);
      showToast("Image uploaded");
    } else {
      showToast(result.error, "error");
    }
    e.target.value = "";
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("images", images.join("\n"));
    features.filter(Boolean).forEach((f) => fd.append("features", f));

    const result = product
      ? await updateProductAction(product.id, fd)
      : await createProductAction(fd);

    setLoading(false);
    if (result.success) {
      showToast(product ? "Product updated" : "Product created");
      router.push("/admin/products");
      router.refresh();
    } else {
      showToast(result.error, "error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6">
      <AdminFormSection title="Basic Info">
        <AdminField label="Name">
          <input
            name="name"
            required
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            className={adminInputClass}
          />
        </AdminField>
        <AdminField label="Slug" hint="Auto-generated from name; editable before save">
          <input
            name="slug"
            required
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugEdited(true);
            }}
            className={adminInputClass}
          />
        </AdminField>
        <AdminField label="Description">
          <textarea
            name="description"
            rows={4}
            defaultValue={product?.description ?? ""}
            className={adminInputClass}
          />
        </AdminField>
        <AdminField label="Category">
          <input
            name="category"
            list="categories"
            defaultValue={product?.category ?? ""}
            className={adminInputClass}
          />
          <datalist id="categories">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </AdminField>
      </AdminFormSection>

      <AdminFormSection title="Feature Bullets">
        {features.map((f, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={f}
              onChange={(e) => {
                const next = [...features];
                next[i] = e.target.value;
                setFeatures(next);
              }}
              className={adminInputClass}
              placeholder={`Feature ${i + 1}`}
            />
            <button
              type="button"
              onClick={() => setFeatures(features.filter((_, j) => j !== i))}
              className="shrink-0 text-error"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setFeatures([...features, ""])}
          className="text-sm text-primary"
        >
          + Add bullet
        </button>
      </AdminFormSection>

      <AdminFormSection title="Images">
        <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} />
        {uploading && <p className="text-sm text-muted">Uploading…</p>}
        <div className="flex flex-wrap gap-3">
          {images.map((url, i) => (
            <div key={url} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-20 w-20 rounded-lg border object-cover" />
              <button
                type="button"
                onClick={() => setImages(images.filter((_, j) => j !== i))}
                className="absolute -right-1 -top-1 rounded-full bg-error px-1 text-xs text-white"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </AdminFormSection>

      <AdminFormSection title="Pricing & Stock">
        <div className="grid gap-4 sm:grid-cols-3">
          <AdminField label="Original Price (Rs.)">
            <input
              name="originalPrice"
              type="number"
              required
              min={0}
              defaultValue={product?.originalPrice ?? ""}
              className={adminInputClass}
            />
          </AdminField>
          <AdminField label="Sale Price (Rs.) — optional">
            <input
              name="salePrice"
              type="number"
              min={0}
              defaultValue={product?.salePrice ?? ""}
              className={adminInputClass}
            />
          </AdminField>
          <AdminField label="Stock">
            <input
              name="stock"
              type="number"
              required
              min={0}
              defaultValue={product?.stock ?? 0}
              className={adminInputClass}
            />
          </AdminField>
        </div>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input
              name="featured"
              type="checkbox"
              defaultChecked={product?.featured ?? false}
              className="rounded border-border"
            />
            Featured on homepage
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              name="active"
              type="checkbox"
              defaultChecked={product?.active ?? true}
              className="rounded border-border"
            />
            Active (visible on storefront)
          </label>
        </div>
      </AdminFormSection>

      <div className="flex gap-3">
        <AdminPrimaryButton type="submit" disabled={loading}>
          {loading ? "Saving…" : product ? "Save Changes" : "Create Product"}
        </AdminPrimaryButton>
        <a
          href="/admin/products"
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}

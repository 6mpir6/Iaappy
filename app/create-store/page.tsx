"use client"

import { useState, type ChangeEvent } from "react"
import { useForm, useFieldArray, type SubmitHandler } from "react-hook-form"
import Papa from "papaparse"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

// Update the Product type to include imageUrls
type Product = {
  title: string
  imageUrl: string
  imageUrls: string[] // Add this new field
  description: string
  price: number | string
}

type FormValues = {
  storeName: string
  storeDescription: string
  logoUrl: string
  themeColor: string
  presetTheme?: "light" | "dark" | "minimal" | "modern"
  products: Product[]
  containerStyle: "rounded" | "straight"
  layout: "list" | "grid-2" | "grid-3" | "grid-4" | "carousel" | "masonry"
}

export default function CreateStore() {
  const [step, setStep] = useState(1)
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false)
  const [isGeneratingLogo, setIsGeneratingLogo] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    defaultValues: {
      products: [],
      containerStyle: "rounded",
      layout: "grid-3",
      themeColor: "#3b82f6",
    },
    mode: "onChange",
  })

  const { fields, append, remove, replace } = useFieldArray({
    name: "products",
    control,
  })

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsSubmitting(true)
    setSubmitError(null)
    console.log("FINAL PAYLOAD", data)

    try {
      const response = await fetch("/api/stores", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      })

      if (!response.ok) {
        const result = await response.json().catch(() => ({ message: "Failed to create store." }))
        throw new Error(result.message || "Failed to create store.")
      }

      const result = await response.json()
      // Redirect to the new store page
      router.push(`/store/${result.storeId}`)
    } catch (error: any) {
      console.error("Error creating store:", error)
      setSubmitError(error.message || "An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  // === Step 1: AI Generation ===
  const generateDescription = async () => {
    setIsGeneratingDescription(true)
    try {
      const res = await fetch("/api/generate-description", {
        method: "POST",
        body: JSON.stringify({ prompt: watch("storeTitle") }),
        headers: { "Content-Type": "application/json" },
      })

      if (!res.ok) throw new Error("Failed to generate description")

      const json = await res.json()
      setValue("storeDescription", json.text)
    } catch (error) {
      console.error("Error generating description:", error)
      // Fallback description
      setValue(
        "storeDescription",
        `Welcome to ${watch("storeTitle")}! We offer a curated selection of high-quality products designed to enhance your lifestyle. Browse our collection and discover items that combine style, functionality, and value.`,
      )
    } finally {
      setIsGeneratingDescription(false)
    }
  }

  const generateLogo = async () => {
    setIsGeneratingLogo(true)
    try {
      const res = await fetch("/api/generate-logo", {
        method: "POST",
        body: JSON.stringify({ prompt: watch("storeTitle") }),
        headers: { "Content-Type": "application/json" },
      })

      if (!res.ok) throw new Error("Failed to generate logo")

      const blob = await res.blob()
      const file = new File([blob], "logo.png", { type: blob.type })
      setValue("logoFile", [file] as any)
    } catch (error) {
      console.error("Error generating logo:", error)
      // No fallback for logo
    } finally {
      setIsGeneratingLogo(false)
    }
  }

  // === Step 2: CSV Upload ===
  const handleCsvUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    Papa.parse<Product>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // assume CSV has columns: title,imageUrl,description,price
        replace(
          results.data.map((row) => ({
            title: row.title || "",
            imageUrl: row.imageUrl || "",
            imageUrls: [], // Initialize empty array for multiple images
            description: row.description || "",
            price: Number(row.price) || 0,
          })),
        )
      },
    })
  }

  const prevStep = () => {
    setStep(step - 1)
  }

  const nextStep = () => {
    setStep(step + 1)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Your Store</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Complete the steps below to set up your online store</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Step Indicator */}
          <div className="flex space-x-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`flex-1 py-2 text-center ${
                  step === i
                    ? "font-bold border-b-2 border-blue-600 text-blue-600 dark:text-blue-400"
                    : "text-gray-400 dark:text-gray-500"
                }`}
                onClick={() => setStep(i)}
              >
                Step {i}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <label className="block">
                <span className="font-medium text-gray-700 dark:text-gray-300">Store Title</span>
                <input
                  {...register("storeName", { required: true })}
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </label>

              <label className="block">
                <span className="font-medium text-gray-700 dark:text-gray-300">Store Description</span>
                <textarea
                  {...register("storeDescription", { required: true })}
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  rows={4}
                />
              </label>
              <Button
                type="button"
                onClick={generateDescription}
                disabled={isGeneratingDescription || !watch("storeName")}
                className="flex items-center gap-2"
              >
                {isGeneratingDescription ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate with AI"
                )}
              </Button>

              <label className="block mt-6">
                <span className="font-medium text-gray-700 dark:text-gray-300">Logo</span>
                <input
                  {...register("logoFile")}
                  type="file"
                  accept="image/*"
                  className="mt-1 block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900 dark:file:text-blue-200 hover:file:bg-blue-100 dark:hover:file:bg-blue-800"
                />
              </label>
              <Button
                type="button"
                onClick={generateLogo}
                disabled={isGeneratingLogo || !watch("storeName")}
                variant="outline"
                className="flex items-center gap-2"
              >
                {isGeneratingLogo ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Logo with AI"
                )}
              </Button>
              {watch("logoFile")?.[0] && (
                <div className="mt-4 border border-gray-200 dark:border-gray-700 rounded-md p-4 flex justify-center">
                  <Image
                    src={URL.createObjectURL(watch("logoFile")![0]!) || "/placeholder.svg"}
                    width={150}
                    height={150}
                    alt="logo preview"
                    className="object-contain"
                  />
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <span className="font-medium text-gray-700 dark:text-gray-300">Bulk CSV Upload</span>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCsvUpload}
                  className="text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900 dark:file:text-blue-200 hover:file:bg-blue-100 dark:hover:file:bg-blue-800"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full table-auto border-collapse">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-700">
                      {["Title", "Image URL", "Description", "Price", "Actions"].map((h) => (
                        <th
                          key={h}
                          className="border border-gray-200 dark:border-gray-600 px-2 py-1 text-left text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map((field, idx) => (
                      <tr key={field.id} className="border-b border-gray-200 dark:border-gray-700">
                        <td className="border border-gray-200 dark:border-gray-600 px-2 py-1">
                          <input
                            {...register(`products.${idx}.title` as const)}
                            className="w-full p-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                        </td>
                      <td className="border border-gray-200 dark:border-gray-600 px-2 py-1">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <input
                              {...register(`products.${idx}.imageUrl` as const)}
                              className="w-full p-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                              placeholder="Primary Image URL"
                            />
                            <label className="text-sm bg-blue-500 text-white px-2 py-1 rounded cursor-pointer">
                              Upload
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) {
                                    const reader = new FileReader()
                                    reader.onloadend = () => {
                                      const existing: string[] = watch(`products.${idx}.imageUrls`) || []
                                      setValue(`products.${idx}.imageUrl`, reader.result as string)
                                      setValue(`products.${idx}.imageUrls`, [...existing, reader.result as string])
                                    }
                                    reader.readAsDataURL(file)
                                  }
                                  e.target.value = ""
                                }}
                              />
                            </label>
                          </div>
                          <input
                            {...register(`products.${idx}.imageUrls` as const)}
                            className="w-full p-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            placeholder="Additional Image URLs (comma separated)"
                          />
                        </div>
                      </td>
                        <td className="border border-gray-200 dark:border-gray-600 px-2 py-1">
                          <input
                            {...register(`products.${idx}.description` as const)}
                            className="w-full p-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                        </td>
                        <td className="border border-gray-200 dark:border-gray-600 px-2 py-1">
                          <input
                            type="number"
                            step="0.01"
                            {...register(`products.${idx}.price` as const)}
                            className="w-full p-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                        </td>
                        <td className="border border-gray-200 dark:border-gray-600 px-2 py-1">
                          <button
                            type="button"
                            onClick={() => remove(idx)}
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Button
                type="button"
                onClick={() => append({ title: "", imageUrl: "", imageUrls: [], description: "", price: 0 })}
                variant="outline"
                className="mt-2"
              >
                + Add Product
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <label className="block">
                <span className="font-medium text-gray-700 dark:text-gray-300">Theme Color</span>
                <div className="flex items-center mt-1 space-x-2">
                  <input type="color" {...register("themeColor")} className="h-10 w-16 p-0 border-0" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{watch("themeColor")}</span>
                </div>
              </label>

              <div className="mt-4">
                <span className="font-medium text-gray-700 dark:text-gray-300">Container Style</span>
                <div className="mt-2 flex items-center space-x-4">
                  <label className="inline-flex items-center">
                    <input type="radio" value="rounded" {...register("containerStyle")} className="text-blue-600" />
                    <span className="ml-2 text-gray-700 dark:text-gray-300">Rounded</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input type="radio" value="straight" {...register("containerStyle")} className="text-blue-600" />
                    <span className="ml-2 text-gray-700 dark:text-gray-300">Straight</span>
                  </label>
                </div>
              </div>

              <div className="mt-6 p-4 border border-gray-200 dark:border-gray-700 rounded-md">
                <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Preview</h3>
                <div
                  className="h-32 border-2"
                  style={{
                    borderColor: watch("themeColor"),
                    borderRadius: watch("containerStyle") === "rounded" ? "0.5rem" : "0",
                  }}
                ></div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <span className="font-medium text-gray-700 dark:text-gray-300">Choose Layout</span>
              <div className="grid grid-cols-3 gap-4 mt-2">
                {[
                  { value: "list", label: "List View" },
                  { value: "grid-2", label: "2-Column Grid" },
                  { value: "grid-3", label: "3-Column Grid" },
                  { value: "grid-4", label: "4-Column Grid" },
                  { value: "carousel", label: "Carousel" },
                  { value: "masonry", label: "Masonry" },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className="flex flex-col items-center p-3 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer"
                  >
                    <input type="radio" className="mb-2" value={opt.value} {...register("layout")} />
                    <div
                      className={`w-24 h-16 bg-gray-100 dark:bg-gray-700 grid grid-cols-${opt.value.split("-")[1]} gap-1 p-1`}
                    >
                      {[...Array(Number(opt.value.split("-")[1]))].map((_, i) => (
                        <div
                          key={i}
                          className="bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500"
                        />
                      ))}
                    </div>
                    <span className="mt-2 text-sm text-gray-700 dark:text-gray-300">{opt.label}</span>
                  </label>
                ))}
              </div>

              <div className="mt-6 p-4 border border-gray-200 dark:border-gray-700 rounded-md">
                <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Summary</h3>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li>
                    <span className="font-medium">Store Name:</span> {watch("storeName") || "Not set"}
                  </li>
                  <li>
                    <span className="font-medium">Products:</span> {fields.length}
                  </li>
                  <li>
                    <span className="font-medium">Theme:</span> {watch("themeColor")}
                  </li>
                  <li>
                    <span className="font-medium">Layout:</span> {watch("layout")}
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
            {step > 1 && (
              <Button type="button" onClick={prevStep} variant="outline">
                Previous
              </Button>
            )}
            {step < 4 ? (
              <Button type="button" onClick={nextStep}>
                Next
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Your Store"
                )}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

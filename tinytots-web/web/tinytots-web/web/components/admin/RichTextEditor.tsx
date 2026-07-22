"use client";

import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

export default function RichTextEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  return (
    <ReactQuill
      theme="snow"
      value={value}
      onChange={onChange}
      modules={{
        toolbar: [
          ["bold", "italic", "underline"],
          [{ header: [2, 3, false] }],
          [{ list: "ordered" }, { list: "bullet" }],
          ["clean"],
        ],
      }}
    />
  );
}
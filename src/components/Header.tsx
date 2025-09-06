"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur">
        <div className="max-w-[990px] mx-auto px-4">
          <div className="h-16 flex items-center justify-center relative">
            <button
              type="button"
              aria-label={open ? "Fechar menu" : "Abrir menu"}
              onClick={() => setOpen((v) => !v)}
              className="absolute left-2 inline-flex items-center justify-center w-10 h-10 rounded-md bg-white/70 hover:bg-white transition"
            >
              {/* Hamburger icon */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-neutral-700">
                {open ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M3 12h18M3 18h18" />
                  </>
                )}
              </svg>
            </button>

            <Link href="/" className="inline-flex items-center select-none">
              {/* Tenta exibir a imagem se existir em /public; caso contrário, o texto será o fallback visual */}
              <Image
                src="/logo-commarilia.png"
                alt="ComMarília"
                width={180}
                height={40}
                className="h-8 w-auto object-contain"
                priority
              />
            </Link>
          </div>
        </div>
      </header>

      {/* Drawer lateral simples (visual) */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <nav className="fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-neutral-600">Menu</span>
              <button
                type="button"
                aria-label="Fechar menu"
                onClick={() => setOpen(false)}
                className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-black/5"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-neutral-700">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <ul className="space-y-1">
              {[
                { href: "/", label: "Início" },
                { href: "#brasil", label: "Brasil" },
                { href: "#marilia", label: "Marília" },
                { href: "#mundo", label: "Mundo" },
                { href: "#regiao", label: "Região" },
                { href: "#saude", label: "Saúde" },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-md px-3 py-2 text-sm text-neutral-800 hover:bg-black/5"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </>
      )}
    </>
  );
}

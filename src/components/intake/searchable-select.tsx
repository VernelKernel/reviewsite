"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";

export type CatalogOption = { slug: string; name: string };

export function SearchableSelect({
  label,
  name,
  options,
  value,
  onChange,
  multiple = false,
  invalid = false,
}: {
  label: string;
  name: string;
  options: CatalogOption[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
  invalid?: boolean;
}) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const selected = useMemo(() => (Array.isArray(value) ? value : value ? [value] : []), [value]);
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return options.filter((option) => {
      if (multiple && selected.includes(option.name)) return false;
      return option.name.toLowerCase().includes(needle);
    });
  }, [multiple, options, query, selected]);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  function openList() {
    setOpen(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function closeList() {
    setOpen(false);
    setQuery("");
  }

  function choose(option: CatalogOption) {
    if (multiple) {
      onChange([...selected, option.name]);
      setQuery("");
      inputRef.current?.focus();
      return;
    }
    onChange(option.name);
    closeList();
  }

  function remove(optionName: string) {
    onChange(selected.filter((item) => item !== optionName));
  }

  function onQueryKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, Math.max(visible.length - 1, 0)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const option = visible[activeIndex];
      if (option) choose(option);
    } else if (event.key === "Escape") {
      closeList();
    } else if (event.key === "Backspace" && multiple && query === "" && selected.length > 0) {
      remove(selected[selected.length - 1]);
    }
  }

  function onControlKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (open) return;
    if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
      event.preventDefault();
      openList();
    }
  }

  const shown = multiple ? selected : open ? [] : selected;

  return (
    <div className="search-select" ref={rootRef}>
      {multiple ? (
        selected.map((item) => <input key={item} type="hidden" name={name} value={item} />)
      ) : (
        <input type="hidden" name={name} value={selected[0] ?? ""} />
      )}
      <div
        className={`search-select-control${open ? " search-select-open" : ""}`}
        tabIndex={open ? -1 : 0}
        aria-invalid={invalid || undefined}
        onClick={() => {
          if (!open) openList();
        }}
        onKeyDown={onControlKeyDown}
      >
        <div className="search-select-value">
          {shown.map((item) =>
            multiple ? (
              <span className="search-select-chip" key={item}>
                {item}
                <button
                  type="button"
                  aria-label={`Remove ${item}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    remove(item);
                  }}
                >
                  <svg viewBox="0 0 12 12" aria-hidden="true">
                    <path d="M3 3 9 9 M9 3 3 9" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                </button>
              </span>
            ) : (
              <span key={item}>{item}</span>
            ),
          )}
          {open ? (
            <input
              ref={inputRef}
              className="search-select-query"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded="true"
              aria-controls={listId}
              aria-label={label}
              aria-activedescendant={visible[activeIndex] ? `${listId}-${visible[activeIndex].slug}` : undefined}
              value={query}
              placeholder="Search"
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={onQueryKeyDown}
              onClick={(event) => event.stopPropagation()}
            />
          ) : null}
        </div>
        <button
          className="search-select-toggle"
          type="button"
          aria-label={open ? `Hide ${label} options` : `Show ${label} options`}
          aria-expanded={open}
          onClick={(event) => {
            event.stopPropagation();
            if (open) closeList();
            else openList();
          }}
        >
          <svg viewBox="0 0 12 12" aria-hidden="true">
            <path d="M2.2 4.4 6 8.1 9.8 4.4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      {open ? (
        <ul className="search-select-menu" id={listId} role="listbox" aria-label={label}>
          {visible.length > 0 ? (
            visible.map((option, index) => (
              <li key={option.slug}>
                <button
                  id={`${listId}-${option.slug}`}
                  className="search-select-option"
                  type="button"
                  role="option"
                  aria-selected={!multiple && selected[0] === option.name}
                  data-active={index === activeIndex ? "true" : undefined}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => choose(option)}
                >
                  {option.name}
                </button>
              </li>
            ))
          ) : (
            <li className="search-select-empty">No matches.</li>
          )}
        </ul>
      ) : null}
    </div>
  );
}

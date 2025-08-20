#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
import sys
import unicodedata
from pathlib import Path
from datetime import datetime

def norm(s: str) -> str:
    """
    Normaliza para comparar:
    - quita espacios al inicio/fin
    - pasa a minúsculas
    - elimina marcas diacríticas (tildes)
    - colapsa espacios internos múltiples a uno
    """
    if not isinstance(s, str):
        return ""
    s = " ".join(s.strip().split()).lower()
    # Eliminar acentos/diacríticos
    s = "".join(c for c in unicodedata.normalize("NFD", s)
                if unicodedata.category(c) != "Mn")
    return s

def find_json_path(arg_path: str | None) -> Path:
    here = Path(__file__).resolve().parent
    if arg_path:
        p = (here / arg_path).resolve()
        if not p.exists() or p.suffix.lower() != ".json":
            raise FileNotFoundError(f"No encontré el JSON: {p}")
        return p

    jsons = sorted([p for p in here.iterdir() if p.suffix.lower() == ".json"])
    if not jsons:
        raise FileNotFoundError("No hay archivos .json en este directorio.")
    if len(jsons) == 1:
        return jsons[0]
    raise RuntimeError(
        "Hay varios .json en el directorio. "
        "Indica el archivo:  python dedup_palabras.py nombre.json"
    )

def load_json(path: Path):
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)

def backup_file(path: Path) -> Path:
    ts = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup = path.with_suffix(path.suffix + f".bak-{ts}")
    backup.write_bytes(path.read_bytes())
    return backup

def save_json(path: Path, data):
    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")

def generate_word_list_txt(json_path: Path, entries: list[dict]) -> Path:
    """
    Genera un archivo TXT con la lista de palabras únicas del JSON limpio.
    """
    txt_path = json_path.with_suffix('.txt')
    
    # Extraer solo las palabras válidas (no vacías)
    words = []
    for item in entries:
        if is_valid_entry(item):
            palabra = item.get("palabra", "").strip()
            if palabra:  # No está vacía
                words.append(palabra)
    
    # Ordenar las palabras alfabéticamente
    words.sort()
    
    # Escribir al archivo TXT
    with txt_path.open("w", encoding="utf-8") as f:
        for word in words:
            f.write(word + "\n")
    
    return txt_path

def is_valid_entry(x) -> bool:
    return isinstance(x, dict) and "palabra" in x

def count_valid_words(entries: list[dict]) -> int:
    """
    Cuenta cuántas entradas tienen una palabra válida (no vacía).
    """
    count = 0
    for item in entries:
        if is_valid_entry(item):
            palabra = item.get("palabra", "").strip()
            if palabra:  # No está vacía
                count += 1
    return count

def dedup(entries: list[dict]) -> tuple[list[dict], list[dict]]:
    """
    Devuelve (limpio, eliminados)
    Mantiene la primera ocurrencia por 'palabra' normalizada.
    """
    seen = set()
    cleaned = []
    removed = []
    for idx, item in enumerate(entries):
        if not is_valid_entry(item):
            # Si no cumple el formato esperado, lo dejamos tal cual
            cleaned.append(item)
            continue
        key = norm(item.get("palabra", ""))
        if key == "":
            # 'palabra' vacío: lo dejamos pasar
            cleaned.append(item)
            continue
        if key in seen:
            removed.append(item)
        else:
            seen.add(key)
            cleaned.append(item)
    return cleaned, removed

def main():
    try:
        arg = sys.argv[1] if len(sys.argv) > 1 else None
        json_path = find_json_path(arg)
        data = load_json(json_path)

        if not isinstance(data, list):
            raise ValueError("El JSON debe ser una lista de objetos.")

        original_count = len(data)
        cleaned, removed = dedup(data)

        # Generar archivo TXT con la lista de palabras
        txt_path = generate_word_list_txt(json_path, cleaned)
        total_words = count_valid_words(cleaned)

        if not removed:
            print(f"No se encontraron duplicados en '{json_path.name}'.")
            print(f"Total de palabras principales: {total_words}")
            print(f"Lista de palabras generada: {txt_path.name}")
            return

        # Respaldo y guardado
        bkp = backup_file(json_path)
        save_json(json_path, cleaned)

        # Resumen
        kept = original_count - len(removed)
        print(f"Archivo procesado: {json_path.name}")
        print(f"Respaldo creado:    {bkp.name}")
        print(f"Total original:     {original_count}")
        print(f"Conservados:        {kept}")
        print(f"Eliminados:         {len(removed)}")
        print(f"Palabras principales: {total_words}")
        print(f"Lista de palabras generada: {txt_path.name}\n")

        # Mostrar cuáles se eliminaron (por su 'palabra' original)
        print("Entradas eliminadas (palabra):")
        for r in removed:
            print(f" - {r.get('palabra')}")

    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Lightweight Leumx section validator.
Checks, per .liquid file:
  - {% schema %} JSON parses (if present)
  - if/endif, for/endfor, unless/endunless, case/endcase paired
  - no hardcoded brand hex colors outside {% schema %} defaults (must use --lx-* vars)
Not a full Liquid parser; catches the common section-breaking mistakes.
"""
import sys, re, json

BRAND_HEX = re.compile(r'#(0e1d33|0a1526|16294a|c39a4e|d8b368|f6f3ec|fcfbf8|1b2431|55606e|e4ded2)', re.I)

def check(path):
    src = open(path).read()
    errors, warnings = [], []

    # schema — anchor on the LAST {% schema %} open tag so a literal
    # "{% schema %}" mentioned in a comment can't be mistaken for the block.
    opens = [m.end() for m in re.finditer(r'{%-?\s*schema\s*-?%}', src)]
    close = re.search(r'{%-?\s*endschema\s*-?%}', src)
    schema_span = None
    if opens and close:
        start = opens[-1]
        schema_span = (start, close.start())
        try:
            json.loads(src[start:close.start()])
        except Exception as e:
            errors.append(f"schema JSON invalid: {e}")
    elif opens or close:
        errors.append("schema/endschema tags unbalanced")

    # tag pairing
    for open_t, close_t in [("if", "endif"), ("for", "endfor"),
                            ("unless", "endunless"), ("case", "endcase")]:
        o = len(re.findall(r'{%-?\s*' + open_t + r'\b', src))
        c = len(re.findall(r'{%-?\s*' + close_t + r'\b', src))
        if o != c:
            errors.append(f"{open_t}/{close_t} unbalanced: {o} open, {c} close")

    # hardcoded brand hex outside schema block
    for mm in BRAND_HEX.finditer(src):
        if schema_span and schema_span[0] <= mm.start() <= schema_span[1]:
            continue  # allowed as a schema default value
        line = src[:mm.start()].count("\n") + 1
        warnings.append(f"hardcoded brand hex {mm.group(0)} at line {line} (use --lx-* var)")

    return errors, warnings

def main():
    ok = True
    for path in sys.argv[1:]:
        errs, warns = check(path)
        status = "OK" if not errs else "FAIL"
        if errs: ok = False
        print(f"[{status}] {path}")
        for e in errs:  print(f"    ERROR:   {e}")
        for w in warns: print(f"    warning: {w}")
    sys.exit(0 if ok else 1)

if __name__ == "__main__":
    main()

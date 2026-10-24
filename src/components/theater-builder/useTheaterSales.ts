"use client";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { TheaterDesign } from "./design";
import { fitSeatingLayout, parseSavedDesign } from "./design";
import { visualDesign } from "@/lib/theater/visual-design";
import {
  EMPTY_CUSTOMER,
  EMPTY_EQUIPMENT,
  type Equipment,
  type Product,
  type Slot,
  type SalesProject,
  type Customer,
  type ServiceLine,
  type SavedProject,
  type QuoteSnapshot,
  type QuoteHistory,
} from "@/lib/theater/types";
import { applyProjector, calculateQuote } from "@/lib/theater/quote";
import { parseProject } from "@/lib/theater/validation";

import { api, downloadQuote } from "@/lib/theater/client";
import { useTheaterSession } from "./TheaterSession";
import type { ServiceRate } from "@/lib/theater/access";
export function useTheaterSales(
  design: TheaterDesign,
  setDesign: Dispatch<SetStateAction<TheaterDesign>>,
) {
  const { member, loading: sessionLoading } = useTheaterSession();
  const identityRef = useRef(member?.uid);
  identityRef.current = member?.uid;
  const [workspaceUid, setWorkspaceUid] = useState(member?.uid);
  const maxDiscount =
    member?.role === "admin" ? 100 : (member?.maxDiscountPercent ?? 0);
  const [rates, setRates] = useState<ServiceRate[]>([]);
  const [products, setProducts] = useState<Product[]>([]),
    [catalogError, setCatalogError] = useState("");
  const [equipment, setEquipment] = useState<Equipment>(EMPTY_EQUIPMENT),
    [customer, setCustomer] = useState<Customer>(EMPTY_CUSTOMER),
    [services, setServices] = useState<ServiceLine[]>([]);
  const [discountPercent, setDiscount] = useState(0),
    [validityDays, setValidity] = useState(15),
    [terms, setTerms] = useState(""),
    [exclusions, setExclusions] = useState("");
  const [slot, setSlot] = useState<Slot | null>(null),
    [review, setReview] = useState(false),
    [projectsOpen, setProjectsOpen] = useState(false);
  const [project, setProject] = useState<{
      id: string;
      version: number;
    } | null>(null),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [quote, setQuote] = useState<QuoteSnapshot | null>(null);
  const quoteRequest = useRef<string | null>(null);
  const [history, setHistory] = useState<QuoteHistory[]>([]);
  const refresh = useCallback(async () => {
    const uid = member?.uid;
    try {
      if (!member) {
        setProducts([]);
        setRates([]);
        setCatalogError("");
        return;
      }
      const [result, serviceRates] = await Promise.all([
        api<{ products: Product[] }>("/api/theater/catalog"),
        api<{ rates: ServiceRate[] }>("/api/theater/service-rates"),
      ]);
      if (identityRef.current !== uid) return;
      setRates(serviceRates.rates);
      setProducts(result.products);
      setCatalogError("");
    } catch (error) {
      if (identityRef.current === uid)
        setCatalogError((error as Error).message);
    }
  }, [member?.uid]);
  useEffect(() => {
    if (!sessionLoading) void refresh();
  }, [refresh, sessionLoading]);
  useEffect(() => {
    setProducts([]);
    setRates([]);
    setEquipment(EMPTY_EQUIPMENT);
    setCustomer(EMPTY_CUSTOMER);
    setServices([]);
    setDiscount(0);
    setProject(null);
    setQuote(null);
    setHistory([]);
    setReview(false);
    setSlot(null);
    setProjectsOpen(false);
    setTerms("");
    setExclusions("");
    setMessage("");
    setBusy(false);
    setWorkspaceUid(member?.uid);
  }, [member?.uid]);
  // Reconcile old saved layouts once real cabinet dimensions become available.
  // Seating drags do not trigger this effect or reposition the other rows.
  const catalogLayout = useRef("");
  const layoutSource = useMemo(
    () =>
      JSON.stringify([
        equipment,
        products.map((p) => [
          p.id,
          p.specs.dimensions,
          p.specs.throwMin,
          p.specs.throwMax,
        ]),
      ]),
    [equipment, products],
  );
  useEffect(() => {
    if (catalogLayout.current === layoutSource) return;
    catalogLayout.current = layoutSource;
    const fitted = fitSeatingLayout(visualDesign(design, equipment, products));
    if (fitted.design)
      setDesign((current) => ({
        ...current,
        positions: fitted.design!.positions,
        rowSpacing: fitted.design!.rowSpacing,
      }));
    else setMessage(fitted.reason);
  }, [design, equipment, products, layoutSource, setDesign]);
  const state = useMemo<SalesProject>(
    () => ({
      design,
      equipment,
      customer,
      services,
      discountPercent,
      validityDays,
      terms,
      exclusions,
    }),
    [
      design,
      equipment,
      customer,
      services,
      discountPercent,
      validityDays,
      terms,
      exclusions,
    ],
  );
  const calculation = useMemo(
    () => calculateQuote(state, products),
    [state, products],
  );
  useEffect(() => {
    setQuote(null);
    quoteRequest.current = null;
  }, [state, products]);
  function restore(input: SalesProject) {
    const s = parseProject(input);
    const parsed = parseSavedDesign(
      JSON.stringify({ version: 1, design: s.design }),
    );
    const fitted = fitSeatingLayout(
      visualDesign(parsed, s.equipment, products),
    );
    if (!fitted.design) throw new Error(fitted.reason);
    setDesign({
      ...parsed,
      positions: fitted.design.positions,
      rowSpacing: fitted.design.rowSpacing,
    });
    setEquipment(s.equipment);
    setCustomer(s.customer);
    setServices(s.services);
    setDiscount(s.discountPercent);
    setValidity(s.validityDays);
    setTerms(s.terms);
    setExclusions(s.exclusions);
  }
  function select(p: Product, finish: string) {
    if (!slot) return;
    const nextEquipment =
      slot === "extra"
        ? {
            ...equipment,
            extras: [
              ...equipment.extras,
              { productId: p.id, finish, quantity: 1 },
            ],
          }
        : {
            ...equipment,
            slots: { ...equipment.slots, [slot]: { productId: p.id, finish } },
          };
    const candidate =
      slot === "projector"
        ? applyProjector(design, p)
        : slot === "front"
          ? {
              ...design,
              front:
                p.category === "in-wall"
                  ? ("in-wall" as const)
                  : ("tower" as const),
            }
          : design;
    const fitted = fitSeatingLayout(
      visualDesign(candidate, nextEquipment, products),
    );
    if (!fitted.design) {
      setMessage(fitted.reason);
      return fitted.reason;
    }
    setEquipment(nextEquipment);
    setDesign({
      ...candidate,
      positions: fitted.design.positions,
      rowSpacing: fitted.design.rowSpacing,
    });
    setSlot(null);
    setMessage(`${p.brand} ${p.model} added to the design.`);
  }
  function changeEquipment(update: SetStateAction<Equipment>) {
    const next = typeof update === "function" ? update(equipment) : update;
    const fitted = fitSeatingLayout(visualDesign(design, next, products));
    if (!fitted.design) {
      setMessage(fitted.reason);
      return;
    }
    setEquipment(next);
    setDesign({
      ...design,
      positions: fitted.design.positions,
      rowSpacing: fitted.design.rowSpacing,
    });
  }
  function remove(s: Exclude<Slot, "extra">) {
    setEquipment((e) => {
      const slots = { ...e.slots };
      delete slots[s];
      return { ...e, slots };
    });
  }
  function saveDevice() {
    if (!member) return;
    try {
      localStorage.setItem(
        `epix-theater-sales-v2-${member!.uid}`,
        JSON.stringify({ state, project }),
      );
      setMessage("Design and equipment saved on this device.");
    } catch {
      setMessage(
        "Device storage is full. Save this project to the studio database instead.",
      );
    }
  }
  function loadDevice() {
    if (!member) return false;
    const raw = localStorage.getItem(`epix-theater-sales-v2-${member.uid}`);
    if (!raw) return false;
    const value = JSON.parse(raw);
    restore(value.state);
    setProject(value.project ?? null);
    setMessage("Saved design and equipment restored.");
    return true;
  }
  async function saveDatabase(preview?: string) {
    if (!member) throw new Error("Sign in to save a project.");
    if (discountPercent > maxDiscount)
      throw new Error(
        `Your maximum discount is ${maxDiscount}%. Reduce the discount before saving.`,
      );
    const uid = member.uid;
    const identity = project ?? { id: crypto.randomUUID(), version: 0 };
    const saved = await api<SavedProject>("/api/theater/projects", {
      method: "POST",
      body: JSON.stringify({ ...identity, state: { ...state, preview } }),
    });
    if (identityRef.current !== uid)
      throw new Error(
        "The signed-in account changed. Reopen the project from your dashboard.",
      );
    setProject({ id: saved.id, version: saved.version });
    setMessage(`Project saved · version ${saved.version}`);
    return saved;
  }
  async function save(preview?: string) {
    setBusy(true);
    try {
      await saveDatabase(preview);
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function generate(preview?: string) {
    const uid = member?.uid;
    setBusy(true);
    try {
      const saved = await saveDatabase(preview);
      quoteRequest.current ??= crypto.randomUUID();
      const q = await api<QuoteSnapshot>("/api/theater/quotes", {
        method: "POST",
        body: JSON.stringify({
          requestId: quoteRequest.current,
          projectId: saved.id,
          state: { ...state, preview },
          priceRevisions: Object.fromEntries(
            products.map((p) => [p.id, p.price.revision]),
          ),
        }),
      });
      if (identityRef.current !== uid) return;
      setQuote(q);
      setHistory((h) => [
        {
          id: q.id,
          number: q.number,
          revision: q.revision,
          createdAt: q.createdAt,
        },
        ...h.filter((x) => x.id !== q.id),
      ]);
      setMessage(
        `${q.calculation.complete ? "Quotation" : "Budget estimate"} ${q.number} is ready.`,
      );
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function openProject(id: string) {
    const uid = member?.uid;
    if (!uid) return;
    setBusy(true);
    try {
      const saved = await api<SavedProject & { quotes: QuoteHistory[] }>(
        `/api/theater/projects/${id}`,
      );
      if (identityRef.current !== uid) return;
      restore(saved.state);
      setProject({ id: saved.id, version: saved.version });
      setHistory(saved.quotes);
      setProjectsOpen(false);
      setMessage(`Opened ${saved.name}`);
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function newProject() {
    restore({
      ...state,
      equipment: EMPTY_EQUIPMENT,
      customer: EMPTY_CUSTOMER,
      services: [],
      discountPercent: 0,
      terms: "",
      exclusions: "",
    });
    setProject(null);
    setHistory([]);
    setMessage("New project started with this room layout.");
  }
  const openedFromLink = useRef("");
  useEffect(() => {
    if (!member || !products.length) return;
    const id = new URL(window.location.href).searchParams.get("project");
    const key = `${member.uid}:${id}`;
    if (!id || openedFromLink.current === key) return;
    openedFromLink.current = key;
    if (!/^[0-9a-f-]{36}$/i.test(id)) {
      setMessage("Invalid project link.");
      return;
    }
    void openProject(id);
  }, [member?.uid, products.length]);
  async function download(id: string, number: string) {
    try {
      await downloadQuote(id, number);
    } catch (error) {
      setMessage((error as Error).message);
    }
  }
  return {
    member: workspaceUid === member?.uid ? member : null,
    maxDiscount,
    rates,
    download,
    products,
    catalogError,
    refresh,
    equipment,
    setEquipment: changeEquipment,
    customer,
    setCustomer,
    services,
    setServices,
    discountPercent,
    setDiscount,
    validityDays,
    setValidity,
    terms,
    setTerms,
    exclusions,
    setExclusions,
    slot,
    setSlot,
    review,
    setReview,
    projectsOpen,
    setProjectsOpen,
    project,
    message,
    setMessage,
    busy,
    quote,
    history,
    state,
    calculation,
    select,
    remove,
    saveDevice,
    loadDevice,
    save,
    generate,
    openProject,
    newProject,
  };
}
export type TheaterSales = ReturnType<typeof useTheaterSales>;

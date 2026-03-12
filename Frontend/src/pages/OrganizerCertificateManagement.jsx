import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  FilePlus2,
  History,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../lib/api";
import SummaryApi from "../api/SummaryApi";
import { extractEventItem } from "../lib/backendAdapters";

const normalizeId = (value) => String(value || "").trim();
const normalizeEmail = (value) => String(value || "").trim().toLowerCase();
const buildSelectionKey = (registrationId, email) =>
  `${normalizeId(registrationId)}::${normalizeEmail(email)}`;

const formatDate = (value) => {
  const parsed = new Date(value || 0);
  if (Number.isNaN(parsed.getTime())) return "Date TBD";
  return parsed.toLocaleDateString([], { month: "short", day: "2-digit", year: "numeric" });
};

const formatDateTime = (value) => {
  const parsed = new Date(value || 0);
  if (Number.isNaN(parsed.getTime())) return "Recently";
  return parsed.toLocaleString([], { month: "short", day: "2-digit", year: "numeric" });
};

const parseRegistrationRows = (payload) => {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.registrations)) return payload.registrations;
  if (Array.isArray(payload?.data?.registrations)) return payload.data.registrations;
  return [];
};

const parseCertificateRows = (payload) => {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.certificates)) return payload.certificates;
  if (Array.isArray(payload?.data?.certificates)) return payload.data.certificates;
  return [];
};

const PREVIEW_RATIO = 841 / 595;

const createDefaultCertificateLayout = () => ({
  logo: { x: 50, y: 8, width: 120, anchor: "center" },
  issuerName: { x: 50, y: 20, anchor: "center" },
  title: { x: 50, y: 25, anchor: "center" },
  introText: { x: 50, y: 34, anchor: "center" },
  participantName: { x: 50, y: 38, anchor: "center" },
  actionText: { x: 50, y: 46, anchor: "center" },
  eventName: { x: 50, y: 50, anchor: "center" },
  dateVenue: { x: 50, y: 55, anchor: "center" },
  coordinatorLabel: { x: 9, y: 87, anchor: "left" },
  principalLabel: { x: 91, y: 87, anchor: "right" },
  footerText: { x: 50, y: 93, anchor: "center" },
});

const createDefaultCertificateCustomization = () => ({
  issuerName: "BAJAJ CHANDRAPUR POLYTECHNIC, CHANDRAPUR",
  participationTitle: "Certificate of Participation",
  winnerTitle: "Certificate of Excellence",
  introText: "This is to certify that",
  participationActionText: "has successfully participated in",
  winnerActionText: "has achieved {position} Place in",
  footerText: "Issued by EventMate - Bajaj Chandrapur Polytechnic, Chandrapur",
  coordinatorLabel: "Coordinator",
  principalLabel: "Principal",
  backgroundImageUrl: "",
  layout: createDefaultCertificateLayout(),
});

const DEFAULT_CERTIFICATE_CUSTOMIZATION = Object.freeze(createDefaultCertificateCustomization());

const CERTIFICATE_CUSTOMIZATION_LIMITS = Object.freeze({
  issuerName: 120,
  participationTitle: 90,
  winnerTitle: 90,
  introText: 120,
  participationActionText: 160,
  winnerActionText: 180,
  footerText: 180,
  coordinatorLabel: 50,
  principalLabel: 50,
  backgroundImageUrl: 800,
});

const CUSTOMIZATION_FIELDS = [
  { key: "issuerName", label: "Issuer Name" },
  { key: "participationTitle", label: "Participation Title" },
  { key: "winnerTitle", label: "Winner Title" },
  { key: "introText", label: "Intro Text" },
  { key: "participationActionText", label: "Participation Action Text" },
  { key: "winnerActionText", label: "Winner Action Text", hint: "Use {position} for winners." },
  { key: "footerText", label: "Footer Text" },
  { key: "coordinatorLabel", label: "Coordinator Label" },
  { key: "principalLabel", label: "Principal Label" },
];

const LAYOUT_FIELDS = [
  { key: "logo", label: "Logo", hasWidth: true },
  { key: "issuerName", label: "Issuer Name" },
  { key: "title", label: "Certificate Title" },
  { key: "introText", label: "Intro Text" },
  { key: "participantName", label: "Student Name" },
  { key: "actionText", label: "Action Text" },
  { key: "eventName", label: "Event Name" },
  { key: "dateVenue", label: "Date & Venue" },
  { key: "coordinatorLabel", label: "Coordinator Label" },
  { key: "principalLabel", label: "Principal Label" },
  { key: "footerText", label: "Footer Text" },
];

const clampNumber = (value, min, max) => Math.min(max, Math.max(min, value));

const sanitizeCustomizationField = (value, fallback, maxLength) => {
  const normalized = String(value ?? "").trim();
  if (!normalized) return fallback;
  if (!Number.isFinite(maxLength) || maxLength <= 0) return normalized;
  return normalized.slice(0, maxLength);
};

const sanitizePercent = (value, fallback) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return clampNumber(numeric, 0, 100);
};

const sanitizeAnchor = (value, fallback) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "left" || normalized === "center" || normalized === "right") return normalized;
  return fallback;
};

const sanitizeLogoWidth = (value, fallback) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return clampNumber(numeric, 60, 320);
};

const sanitizeBackgroundImageUrl = (value) => {
  const normalized = String(value ?? "").trim();
  if (!normalized) return "";
  if (!/^https?:\/\//i.test(normalized)) return "";
  return normalized.slice(0, CERTIFICATE_CUSTOMIZATION_LIMITS.backgroundImageUrl);
};

const normalizeLayoutNode = (layoutNode, fallbackNode) => ({
  x: sanitizePercent(layoutNode?.x, fallbackNode.x),
  y: sanitizePercent(layoutNode?.y, fallbackNode.y),
  anchor: sanitizeAnchor(layoutNode?.anchor, fallbackNode.anchor),
});

const normalizeCertificateLayout = (layoutValue) => {
  const source = layoutValue && typeof layoutValue === "object" ? layoutValue : {};
  const fallback = createDefaultCertificateLayout();

  return {
    logo: {
      ...normalizeLayoutNode(source.logo, fallback.logo),
      width: sanitizeLogoWidth(source.logo?.width, fallback.logo.width),
    },
    issuerName: normalizeLayoutNode(source.issuerName, fallback.issuerName),
    title: normalizeLayoutNode(source.title, fallback.title),
    introText: normalizeLayoutNode(source.introText, fallback.introText),
    participantName: normalizeLayoutNode(source.participantName, fallback.participantName),
    actionText: normalizeLayoutNode(source.actionText, fallback.actionText),
    eventName: normalizeLayoutNode(source.eventName, fallback.eventName),
    dateVenue: normalizeLayoutNode(source.dateVenue, fallback.dateVenue),
    coordinatorLabel: normalizeLayoutNode(source.coordinatorLabel, fallback.coordinatorLabel),
    principalLabel: normalizeLayoutNode(source.principalLabel, fallback.principalLabel),
    footerText: normalizeLayoutNode(source.footerText, fallback.footerText),
  };
};

const normalizeCertificateCustomization = (value) => {
  const source = value && typeof value === "object" ? value : {};

  return {
    issuerName: sanitizeCustomizationField(
      source.issuerName,
      DEFAULT_CERTIFICATE_CUSTOMIZATION.issuerName,
      CERTIFICATE_CUSTOMIZATION_LIMITS.issuerName
    ),
    participationTitle: sanitizeCustomizationField(
      source.participationTitle,
      DEFAULT_CERTIFICATE_CUSTOMIZATION.participationTitle,
      CERTIFICATE_CUSTOMIZATION_LIMITS.participationTitle
    ),
    winnerTitle: sanitizeCustomizationField(
      source.winnerTitle,
      DEFAULT_CERTIFICATE_CUSTOMIZATION.winnerTitle,
      CERTIFICATE_CUSTOMIZATION_LIMITS.winnerTitle
    ),
    introText: sanitizeCustomizationField(
      source.introText,
      DEFAULT_CERTIFICATE_CUSTOMIZATION.introText,
      CERTIFICATE_CUSTOMIZATION_LIMITS.introText
    ),
    participationActionText: sanitizeCustomizationField(
      source.participationActionText,
      DEFAULT_CERTIFICATE_CUSTOMIZATION.participationActionText,
      CERTIFICATE_CUSTOMIZATION_LIMITS.participationActionText
    ),
    winnerActionText: sanitizeCustomizationField(
      source.winnerActionText,
      DEFAULT_CERTIFICATE_CUSTOMIZATION.winnerActionText,
      CERTIFICATE_CUSTOMIZATION_LIMITS.winnerActionText
    ),
    footerText: sanitizeCustomizationField(
      source.footerText,
      DEFAULT_CERTIFICATE_CUSTOMIZATION.footerText,
      CERTIFICATE_CUSTOMIZATION_LIMITS.footerText
    ),
    coordinatorLabel: sanitizeCustomizationField(
      source.coordinatorLabel,
      DEFAULT_CERTIFICATE_CUSTOMIZATION.coordinatorLabel,
      CERTIFICATE_CUSTOMIZATION_LIMITS.coordinatorLabel
    ),
    principalLabel: sanitizeCustomizationField(
      source.principalLabel,
      DEFAULT_CERTIFICATE_CUSTOMIZATION.principalLabel,
      CERTIFICATE_CUSTOMIZATION_LIMITS.principalLabel
    ),
    backgroundImageUrl: sanitizeBackgroundImageUrl(source.backgroundImageUrl),
    layout: normalizeCertificateLayout(source.layout),
  };
};

const getPreviewTransformByAnchor = (anchor) => {
  if (anchor === "left") return "translateX(0)";
  if (anchor === "right") return "translateX(-100%)";
  return "translateX(-50%)";
};

const roundToTenth = (value) => Math.round(Number(value || 0) * 10) / 10;

const countEligibleAttendance = (registrationRows) =>
  registrationRows.reduce((sum, registration) => {
    const participants = Array.isArray(registration?.participants) ? registration.participants : [];
    return sum + participants.filter((participant) => Boolean(participant?.attendanceMarked)).length;
  }, 0);

const getEventDateLabel = (eventData) => {
  const start = formatDate(eventData?.schedule?.startDate);
  const end = formatDate(eventData?.schedule?.endDate);
  if (start === end) return start;
  return `${start} - ${end}`;
};

export default function OrganizerCertificateManagement() {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const backgroundInputRef = useRef(null);
  const dragCanvasRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [eventData, setEventData] = useState(null);
  const [registrationRows, setRegistrationRows] = useState([]);
  const [certificateRows, setCertificateRows] = useState([]);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [issuingSelected, setIssuingSelected] = useState(false);
  const [isSelectionOpen, setIsSelectionOpen] = useState(false);
  const [issueSelections, setIssueSelections] = useState({});
  const [customization, setCustomization] = useState(() =>
    normalizeCertificateCustomization(DEFAULT_CERTIFICATE_CUSTOMIZATION)
  );
  const [draftCustomization, setDraftCustomization] = useState(() =>
    normalizeCertificateCustomization(DEFAULT_CERTIFICATE_CUSTOMIZATION)
  );
  const [isCustomizeDialogOpen, setIsCustomizeDialogOpen] = useState(false);
  const [savingCustomization, setSavingCustomization] = useState(false);
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const [draggingLayoutKey, setDraggingLayoutKey] = useState(null);

  const load = useCallback(
    async ({ silent = false } = {}) => {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const [detailResponse, registrationResponse, certificatesResponse] = await Promise.all([
          api({
            ...SummaryApi.get_public_event_details,
            url: SummaryApi.get_public_event_details.url.replace(":eventId", encodeURIComponent(eventId || "")),
          }),
          api({
            ...SummaryApi.get_event_registrations,
            url: SummaryApi.get_event_registrations.url.replace(":eventId", encodeURIComponent(eventId || "")),
          }),
          api({
            ...SummaryApi.get_event_certificates,
            url: SummaryApi.get_event_certificates.url.replace(":eventId", encodeURIComponent(eventId || "")),
            cacheTTL: 45000,
          }),
        ]);

        const event = extractEventItem(detailResponse.data);
        if (!event) {
          setError("Event not found.");
          setEventData(null);
          setRegistrationRows([]);
          setCertificateRows([]);
          const fallbackCustomization = normalizeCertificateCustomization(DEFAULT_CERTIFICATE_CUSTOMIZATION);
          setCustomization(fallbackCustomization);
          setDraftCustomization(fallbackCustomization);
          return;
        }

        const nextCustomization = normalizeCertificateCustomization(event?.certificate?.customization);
        setEventData(event);
        setRegistrationRows(parseRegistrationRows(registrationResponse.data));
        setCertificateRows(parseCertificateRows(certificatesResponse.data));
        setCustomization(nextCustomization);
        setDraftCustomization(nextCustomization);
      } catch (fetchError) {
        setError(fetchError.response?.data?.message || "Unable to load certificate management workspace.");
        setEventData(null);
        setRegistrationRows([]);
        setCertificateRows([]);
        const fallbackCustomization = normalizeCertificateCustomization(DEFAULT_CERTIFICATE_CUSTOMIZATION);
        setCustomization(fallbackCustomization);
        setDraftCustomization(fallbackCustomization);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [eventId]
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!isCustomizeDialogOpen) {
      setDraggingLayoutKey(null);
    }
  }, [isCustomizeDialogOpen]);

  const stats = useMemo(() => {
    const totalRegistered = registrationRows.reduce((sum, row) => {
      const count = Number(row?.totalParticipants);
      if (Number.isFinite(count) && count > 0) return sum + count;

      const participants = Array.isArray(row?.participants) ? row.participants.length : 0;
      if (participants > 0) return sum + participants;

      return sum + 1;
    }, 0);

    const eligibleAttended = countEligibleAttendance(registrationRows);
    const issuedCount = certificateRows.length;

    return {
      totalRegistered,
      eligibleAttended,
      issuedCount,
    };
  }, [registrationRows, certificateRows]);

  const attendedParticipants = useMemo(() => {
    const rows = [];
    const seen = new Set();

    registrationRows.forEach((registration) => {
      const registrationId = normalizeId(registration?._id);
      const participants = Array.isArray(registration?.participants) ? registration.participants : [];
      const isWinner = Boolean(registration?.winner?.isWinner);
      const winnerPosition = String(registration?.winner?.position || "").trim();

      participants.forEach((participant) => {
        if (!participant?.attendanceMarked) return;
        const email = normalizeEmail(participant?.email);
        if (!email || !registrationId) return;
        const key = buildSelectionKey(registrationId, email);
        if (seen.has(key)) return;
        seen.add(key);

        rows.push({
          key,
          registrationId,
          participantName: String(participant?.name || participant?.fullName || "Participant").trim() || "Participant",
          participantEmail: email,
          teamName: String(registration?.teamName || "").trim(),
          defaultType: isWinner ? "winner" : "participation",
          defaultPosition: isWinner ? winnerPosition : ""
        });
      });
    });

    return rows.sort((a, b) => a.participantName.localeCompare(b.participantName));
  }, [registrationRows]);

  useEffect(() => {
    setIssueSelections((prev) => {
      const next = {};
      attendedParticipants.forEach((participant) => {
        const existing = prev?.[participant.key] || {};
        next[participant.key] = {
          selected: Boolean(existing.selected),
          certificateType: existing.certificateType || participant.defaultType,
          position: existing.position || participant.defaultPosition
        };
      });
      return next;
    });
  }, [attendedParticipants]);

  const selectedCount = useMemo(
    () => Object.values(issueSelections).filter((entry) => Boolean(entry?.selected)).length,
    [issueSelections]
  );

  const recentIssued = useMemo(() => {
    return [...certificateRows]
      .sort((a, b) => new Date(b?.issuedAt || 0).getTime() - new Date(a?.issuedAt || 0).getTime())
      .slice(0, 5)
      .map((row, index) => ({
        id: normalizeId(row?._id || `${row?.participantEmail}-${index}`),
        participantName: String(row?.participantName || "Participant").trim() || "Participant",
        participantEmail: normalizeEmail(row?.participantEmail),
        issuedAt: row?.issuedAt || null,
      }));
  }, [certificateRows]);

  const encodedEventId = encodeURIComponent(normalizeId(eventData?._id || eventId || ""));
  const previewCustomization = useMemo(
    () => normalizeCertificateCustomization(isCustomizeDialogOpen ? draftCustomization : customization),
    [customization, draftCustomization, isCustomizeDialogOpen]
  );

  const handleGenerateClick = async () => {
    setGenerating(true);
    setNotice(null);
    try {
      const response = await api({
        ...SummaryApi.generate_event_certificates,
        url: SummaryApi.generate_event_certificates.url.replace(
          ":eventId",
          encodeURIComponent(eventId || "")
        ),
      });
      await load({ silent: true });
      const metrics = response?.data?.data;
      if (metrics) {
        const firstFailureReason = Array.isArray(metrics?.failures)
          ? String(metrics.failures[0]?.reason || "").trim()
          : "";
        const failureSuffix =
          Number(metrics.failedRegistrations || 0) > 0 && firstFailureReason
            ? ` First error: ${firstFailureReason}`
            : "";
        setNotice(
          `Generation completed. Registrations: ${metrics.totalRegistrations}, Issued: ${metrics.generatedCertificates}, Failed: ${metrics.failedRegistrations}.${failureSuffix}`
        );
      } else {
        setNotice("Certificate generation completed and records refreshed.");
      }
    } catch (generateError) {
      setNotice(generateError.response?.data?.message || "Unable to generate certificates.");
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleSelection = (key) => (eventValue) => {
    const checked = Boolean(eventValue?.target?.checked);
    setIssueSelections((prev) => ({
      ...prev,
      [key]: {
        ...(prev?.[key] || {}),
        selected: checked
      }
    }));
  };

  const handleTemplateChange = (key) => (eventValue) => {
    const value = String(eventValue?.target?.value || "").trim();
    setIssueSelections((prev) => ({
      ...prev,
      [key]: {
        ...(prev?.[key] || {}),
        certificateType: value,
        position: value === "winner" ? prev?.[key]?.position || "" : ""
      }
    }));
  };

  const handlePositionChange = (key) => (eventValue) => {
    const value = String(eventValue?.target?.value || "").trim();
    setIssueSelections((prev) => ({
      ...prev,
      [key]: {
        ...(prev?.[key] || {}),
        position: value
      }
    }));
  };

  const handleSelectAll = () => {
    setIssueSelections((prev) => {
      const next = { ...(prev || {}) };
      attendedParticipants.forEach((participant) => {
        next[participant.key] = {
          selected: true,
          certificateType: next[participant.key]?.certificateType || participant.defaultType,
          position: next[participant.key]?.position || participant.defaultPosition
        };
      });
      return next;
    });
  };

  const handleClearSelection = () => {
    setIssueSelections((prev) => {
      const next = { ...(prev || {}) };
      Object.keys(next).forEach((key) => {
        next[key] = { ...(next[key] || {}), selected: false };
      });
      return next;
    });
  };

  const handleIssueSelected = async () => {
    const selections = attendedParticipants
      .filter((participant) => Boolean(issueSelections?.[participant.key]?.selected))
      .map((participant) => {
        const config = issueSelections?.[participant.key] || {};
        const certificateType = String(config.certificateType || "participation").trim();
        return {
          registrationId: participant.registrationId,
          participantEmail: participant.participantEmail,
          certificateType,
          position: certificateType === "winner" ? String(config.position || "").trim() : null
        };
      });

    if (selections.length === 0) {
      setNotice("Select at least one attended student to issue certificates.");
      return;
    }

    const missingPosition = selections.find(
      (selection) => selection.certificateType === "winner" && !selection.position
    );
    if (missingPosition) {
      setNotice("Winner templates require a 1st/2nd/3rd position.");
      return;
    }

    setIssuingSelected(true);
    setNotice(null);
    try {
      const response = await api({
        ...SummaryApi.issue_selected_certificates,
        url: SummaryApi.issue_selected_certificates.url.replace(
          ":eventId",
          encodeURIComponent(eventId || "")
        ),
        data: { selections }
      });

      await load({ silent: true });
      const metrics = response?.data?.data;
      if (metrics) {
        const firstFailureReason = Array.isArray(metrics?.failures)
          ? String(metrics.failures[0]?.reason || "").trim()
          : "";
        const failureSuffix =
          Number(metrics.failed || 0) > 0 && firstFailureReason
            ? ` First error: ${firstFailureReason}`
            : "";
        setNotice(
          `Selected issuance completed. Requested: ${metrics.totalRequested}, Issued: ${metrics.issued}, Skipped: ${metrics.skipped}, Failed: ${metrics.failed}.${failureSuffix}`
        );
      } else {
        setNotice("Selected certificate issuance completed.");
      }
    } catch (issueError) {
      setNotice(issueError.response?.data?.message || "Unable to issue selected certificates.");
    } finally {
      setIssuingSelected(false);
    }
  };

  const handleDownload = (participantEmail) => {
    const normalizedEmail = normalizeEmail(participantEmail);
    const emailSlug = normalizedEmail.replace(/[@.]/g, "_");
    const url = SummaryApi.download_certificate.url
      .replace(":eventId", encodedEventId)
      .replace(":emailSlug", encodeURIComponent(emailSlug));
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleDraftCustomizationChange = (field, value) => {
    setDraftCustomization((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDraftLayoutChange = (fieldKey, property, value) => {
    setDraftCustomization((prev) => ({
      ...prev,
      layout: {
        ...(prev.layout || {}),
        [fieldKey]: {
          ...(prev.layout?.[fieldKey] || createDefaultCertificateLayout()[fieldKey]),
          [property]: value,
        },
      },
    }));
  };

  const applyPointerPositionToLayoutNode = useCallback((fieldKey, clientX, clientY) => {
    const canvasRect = dragCanvasRef.current?.getBoundingClientRect();
    if (!canvasRect || canvasRect.width <= 0 || canvasRect.height <= 0) return;

    const nextX = roundToTenth(clampNumber(((clientX - canvasRect.left) / canvasRect.width) * 100, 0, 100));
    const nextY = roundToTenth(clampNumber(((clientY - canvasRect.top) / canvasRect.height) * 100, 0, 100));

    setDraftCustomization((prev) => ({
      ...prev,
      layout: {
        ...(prev.layout || {}),
        [fieldKey]: {
          ...(prev.layout?.[fieldKey] || createDefaultCertificateLayout()[fieldKey]),
          x: nextX,
          y: nextY,
        },
      },
    }));
  }, []);

  const handleDragCanvasPointerDown = (fieldKey) => (eventValue) => {
    if (!isCustomizeDialogOpen || savingCustomization || uploadingBackground) return;
    eventValue.preventDefault();
    eventValue.stopPropagation();
    setDraggingLayoutKey(fieldKey);
    applyPointerPositionToLayoutNode(fieldKey, eventValue.clientX, eventValue.clientY);
  };

  useEffect(() => {
    if (!draggingLayoutKey) return undefined;

    const handlePointerMove = (eventValue) => {
      applyPointerPositionToLayoutNode(draggingLayoutKey, eventValue.clientX, eventValue.clientY);
    };

    const handlePointerStop = () => {
      setDraggingLayoutKey(null);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerStop);
    window.addEventListener("pointercancel", handlePointerStop);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerStop);
      window.removeEventListener("pointercancel", handlePointerStop);
    };
  }, [applyPointerPositionToLayoutNode, draggingLayoutKey]);

  const updateCustomizationState = (nextCustomization) => {
    const normalized = normalizeCertificateCustomization(nextCustomization);
    setCustomization(normalized);
    setDraftCustomization(normalized);
    setEventData((prev) =>
      prev
        ? {
            ...prev,
            certificate: {
              ...(prev.certificate || {}),
              isEnabled: true,
              customization: normalized,
            },
          }
        : prev
    );
  };

  const triggerBackgroundPicker = () => {
    if (uploadingBackground || savingCustomization) return;
    backgroundInputRef.current?.click();
  };

  const handleBackgroundFileSelected = async (eventValue) => {
    const selectedFile = eventValue?.target?.files?.[0];
    eventValue.target.value = "";
    if (!selectedFile) return;

    setUploadingBackground(true);
    setNotice(null);

    try {
      const formData = new FormData();
      formData.append("background", selectedFile);

      const response = await api({
        ...SummaryApi.upload_event_certificate_background,
        url: SummaryApi.upload_event_certificate_background.url.replace(
          ":eventId",
          encodeURIComponent(eventId || "")
        ),
        data: formData,
      });

      const savedCustomization = normalizeCertificateCustomization(
        response?.data?.data?.customization
      );
      updateCustomizationState(savedCustomization);
      setNotice("Certificate background image updated.");
    } catch (uploadError) {
      setNotice(uploadError.response?.data?.message || "Unable to upload certificate background image.");
    } finally {
      setUploadingBackground(false);
    }
  };

  const handleOpenCustomizationDialog = () => {
    setDraftCustomization(normalizeCertificateCustomization(customization));
    setIsCustomizeDialogOpen(true);
  };

  const handleCloseCustomizationDialog = () => {
    if (savingCustomization || uploadingBackground) return;
    setDraftCustomization(normalizeCertificateCustomization(customization));
    setIsCustomizeDialogOpen(false);
  };

  const handleResetCustomization = () => {
    setDraftCustomization(normalizeCertificateCustomization(DEFAULT_CERTIFICATE_CUSTOMIZATION));
  };

  const handleSaveCustomization = async () => {
    setSavingCustomization(true);
    setNotice(null);

    try {
      const sanitizedCustomization = normalizeCertificateCustomization(draftCustomization);
      const response = await api({
        ...SummaryApi.update_event_certificate_customization,
        url: SummaryApi.update_event_certificate_customization.url.replace(
          ":eventId",
          encodeURIComponent(eventId || "")
        ),
        data: { customization: sanitizedCustomization },
      });

      const savedCustomization = normalizeCertificateCustomization(
        response?.data?.data?.customization || sanitizedCustomization
      );
      updateCustomizationState(savedCustomization);
      setIsCustomizeDialogOpen(false);
      setNotice("Certificate customization saved.");
    } catch (saveError) {
      setNotice(saveError.response?.data?.message || "Unable to save certificate customization.");
    } finally {
      setSavingCustomization(false);
    }
  };

  return (
    <section className="eventmate-page min-h-screen bg-slate-100/80 dark:bg-gray-900 px-4 sm:px-6 py-8">
      <div className="max-w-6xl mx-auto space-y-4">
        <button
          type="button"
          onClick={() => navigate("/organizer-dashboard")}
          className="inline-flex items-center rounded-md p-1 text-slate-600 dark:text-slate-300 hover:bg-white/70 hover:text-slate-900 dark:hover:bg-white/10 dark:hover:text-white"
          aria-label="Back"
        >
          <ArrowLeft size={17} />
        </button>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Certificate Management</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
              Design templates and issue certificates for attendees.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setNotice("Certificate history is shown in the 'Recently Issued' panel.")}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10"
            >
              <History size={13} />
              History Log
            </button>
            <button
              type="button"
              onClick={() => setNotice("Template creation is saved as a UI stub in this build.")}
              className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              <FilePlus2 size={13} />
              New Template
            </button>
          </div>
        </div>

        <input
          ref={backgroundInputRef}
          type="file"
          accept="image/*"
          onChange={handleBackgroundFileSelected}
          className="hidden"
        />

        {notice && (
          <p className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm text-indigo-700 dark:border-indigo-400/30 dark:bg-indigo-500/15 dark:text-indigo-200">
            {notice}
          </p>
        )}

        {loading && (
          <section className="eventmate-panel rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-gray-900/70 p-5 text-sm text-slate-500 dark:text-slate-300 inline-flex items-center gap-2">
            <Loader2 size={14} className="animate-spin" />
            Loading certificate workspace...
          </section>
        )}

        {error && !loading && (
          <section className="eventmate-panel rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-300">
            {error}
          </section>
        )}

        {!loading && !error && (
          <>
            <section className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,1fr)] gap-4">
              <div className="space-y-4">
                <article className="eventmate-panel rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-gray-900/70 p-4">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-300 inline-flex items-center gap-1.5">
                    <ShieldCheck size={12} className="text-indigo-500" />
                    Current Template
                  </p>

                  <div className="mt-3 rounded-xl border border-dashed border-slate-300 dark:border-white/20 bg-slate-50/80 dark:bg-white/5 p-3">
                    <div
                      className="relative mx-auto w-full overflow-hidden rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-slate-900/70"
                      style={{ aspectRatio: PREVIEW_RATIO }}
                    >
                      {previewCustomization.backgroundImageUrl ? (
                        <img
                          src={previewCustomization.backgroundImageUrl}
                          alt="Certificate background"
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      ) : null}

                      <div className="absolute inset-0 border-[3px] border-violet-600 pointer-events-none" />
                      <div className="absolute inset-[8px] border border-pink-500/80 pointer-events-none" />
                      <div className="absolute left-[20px] right-[20px] top-[20px] h-[6px] bg-violet-600 pointer-events-none" />
                      <div className="absolute left-[20px] right-[20px] bottom-[20px] h-[6px] bg-pink-500 pointer-events-none" />

                      <div
                        className="absolute text-[10px] font-semibold tracking-[0.14em] text-violet-700/80 uppercase"
                        style={{
                          left: `${previewCustomization.layout.logo.x}%`,
                          top: `${previewCustomization.layout.logo.y}%`,
                          transform: getPreviewTransformByAnchor(previewCustomization.layout.logo.anchor),
                        }}
                      >
                        EventMate
                      </div>

                      <p
                        className="absolute text-[9px] tracking-[0.1em] text-slate-500 uppercase whitespace-nowrap"
                        style={{
                          left: `${previewCustomization.layout.issuerName.x}%`,
                          top: `${previewCustomization.layout.issuerName.y}%`,
                          transform: getPreviewTransformByAnchor(previewCustomization.layout.issuerName.anchor),
                        }}
                      >
                        {previewCustomization.issuerName}
                      </p>

                      <p
                        className="absolute text-xl font-bold text-slate-800 whitespace-nowrap"
                        style={{
                          left: `${previewCustomization.layout.title.x}%`,
                          top: `${previewCustomization.layout.title.y}%`,
                          transform: getPreviewTransformByAnchor(previewCustomization.layout.title.anchor),
                        }}
                      >
                        {previewCustomization.participationTitle}
                      </p>

                      <p
                        className="absolute text-[11px] text-slate-600 whitespace-nowrap"
                        style={{
                          left: `${previewCustomization.layout.introText.x}%`,
                          top: `${previewCustomization.layout.introText.y}%`,
                          transform: getPreviewTransformByAnchor(previewCustomization.layout.introText.anchor),
                        }}
                      >
                        {previewCustomization.introText}
                      </p>

                      <p
                        className="absolute text-2xl font-bold text-violet-700 whitespace-nowrap"
                        style={{
                          left: `${previewCustomization.layout.participantName.x}%`,
                          top: `${previewCustomization.layout.participantName.y}%`,
                          transform: getPreviewTransformByAnchor(previewCustomization.layout.participantName.anchor),
                        }}
                      >
                        {`{Student Name}`}
                      </p>

                      <p
                        className="absolute text-[11px] text-slate-600 whitespace-nowrap"
                        style={{
                          left: `${previewCustomization.layout.actionText.x}%`,
                          top: `${previewCustomization.layout.actionText.y}%`,
                          transform: getPreviewTransformByAnchor(previewCustomization.layout.actionText.anchor),
                        }}
                      >
                        {previewCustomization.participationActionText}
                      </p>

                      <p
                        className="absolute text-lg font-bold text-slate-900 whitespace-nowrap"
                        style={{
                          left: `${previewCustomization.layout.eventName.x}%`,
                          top: `${previewCustomization.layout.eventName.y}%`,
                          transform: getPreviewTransformByAnchor(previewCustomization.layout.eventName.anchor),
                        }}
                      >
                        {eventData?.title || "Event"}
                      </p>

                      <p
                        className="absolute text-[10px] text-slate-500 whitespace-nowrap"
                        style={{
                          left: `${previewCustomization.layout.dateVenue.x}%`,
                          top: `${previewCustomization.layout.dateVenue.y}%`,
                          transform: getPreviewTransformByAnchor(previewCustomization.layout.dateVenue.anchor),
                        }}
                      >
                        {`${getEventDateLabel(eventData)} - ${eventData?.venue?.location || eventData?.venue?.mode || "TBD"}`}
                      </p>

                      <p
                        className="absolute text-[10px] text-slate-700 whitespace-nowrap"
                        style={{
                          left: `${previewCustomization.layout.coordinatorLabel.x}%`,
                          top: `${previewCustomization.layout.coordinatorLabel.y}%`,
                          transform: getPreviewTransformByAnchor(previewCustomization.layout.coordinatorLabel.anchor),
                        }}
                      >
                        {previewCustomization.coordinatorLabel}
                      </p>

                      <p
                        className="absolute text-[10px] text-slate-700 whitespace-nowrap"
                        style={{
                          left: `${previewCustomization.layout.principalLabel.x}%`,
                          top: `${previewCustomization.layout.principalLabel.y}%`,
                          transform: getPreviewTransformByAnchor(previewCustomization.layout.principalLabel.anchor),
                        }}
                      >
                        {previewCustomization.principalLabel}
                      </p>

                      <p
                        className="absolute text-[9px] text-slate-500 whitespace-nowrap"
                        style={{
                          left: `${previewCustomization.layout.footerText.x}%`,
                          top: `${previewCustomization.layout.footerText.y}%`,
                          transform: getPreviewTransformByAnchor(previewCustomization.layout.footerText.anchor),
                        }}
                      >
                        {previewCustomization.footerText}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-3 text-slate-500 dark:text-slate-300">
                      <span>Landscape</span>
                      <span>A4 Size</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={triggerBackgroundPicker}
                        disabled={uploadingBackground}
                        className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                      >
                        {uploadingBackground ? "Uploading..." : "Replace Image"}
                      </button>
                      <button
                        type="button"
                        onClick={handleOpenCustomizationDialog}
                        className="text-indigo-600 dark:text-indigo-300 hover:text-indigo-700 dark:hover:text-indigo-200"
                      >
                        Customize Fields
                      </button>
                    </div>
                  </div>
                </article>

                <article className="eventmate-panel rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-gray-900/70 p-4">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white inline-flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-indigo-500" />
                    Certificate Issuance Status
                  </p>

                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <article className="rounded-xl border border-indigo-200 bg-indigo-50/70 dark:border-indigo-400/30 dark:bg-indigo-500/15 p-4">
                      <p className="text-xs text-indigo-600 dark:text-indigo-200">Total Registered</p>
                      <p className="mt-1 text-3xl font-bold text-indigo-700 dark:text-indigo-200">{stats.totalRegistered}</p>
                    </article>
                    <article className="rounded-xl border border-emerald-200 bg-emerald-50/70 dark:border-emerald-400/30 dark:bg-emerald-500/15 p-4">
                      <p className="text-xs text-emerald-700 dark:text-emerald-200">Eligible (Attended)</p>
                      <p className="mt-1 text-3xl font-bold text-emerald-700 dark:text-emerald-200">{stats.eligibleAttended}</p>
                    </article>
                  </div>

                  <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                    <p className="inline-flex items-start gap-1.5">
                      <CheckCircle2 size={13} className="text-indigo-500 mt-0.5 shrink-0" />
                      Auto Email: Certificates are emailed to students by backend workflow.
                    </p>
                    <p className="inline-flex items-start gap-1.5">
                      <CheckCircle2 size={13} className="text-indigo-500 mt-0.5 shrink-0" />
                      Student Portal: Students can download issued certificates from dashboard.
                    </p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setIsSelectionOpen((prev) => !prev)}
                      className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10"
                    >
                      {isSelectionOpen ? "Hide Attendees" : "Select Attendees"}
                    </button>
                    <button
                      type="button"
                      onClick={handleGenerateClick}
                      disabled={generating}
                      className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                    >
                      {generating ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                      {generating ? "Generating..." : "Generate Certificates"}
                    </button>
                  </div>

                  {isSelectionOpen && (
                    <div className="mt-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/5 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Attended Students</p>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-300">
                          <button
                            type="button"
                            onClick={handleSelectAll}
                            className="rounded-md border border-slate-300 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-white dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10"
                          >
                            Select all
                          </button>
                          <button
                            type="button"
                            onClick={handleClearSelection}
                            className="rounded-md border border-slate-300 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-white dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10"
                          >
                            Clear
                          </button>
                          <span>{selectedCount} selected</span>
                        </div>
                      </div>

                      {attendedParticipants.length === 0 ? (
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-300">
                          No attended students found yet.
                        </p>
                      ) : (
                        <>
                          <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
                            {attendedParticipants.map((participant) => {
                              const config = issueSelections?.[participant.key] || {};
                              const certificateType = String(config.certificateType || participant.defaultType);
                              const position = String(config.position || participant.defaultPosition);
                              return (
                                <div
                                  key={participant.key}
                                  className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white p-2 dark:border-white/10 dark:bg-slate-900/70"
                                >
                                  <label className="flex items-start gap-2">
                                    <input
                                      type="checkbox"
                                      checked={Boolean(config.selected)}
                                      onChange={handleToggleSelection(participant.key)}
                                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="min-w-0">
                                      <span className="block text-xs font-semibold text-slate-900 dark:text-white">
                                        {participant.participantName}
                                      </span>
                                      <span className="block text-[11px] text-slate-500 dark:text-slate-300">
                                        {participant.participantEmail}
                                        {participant.teamName ? ` • ${participant.teamName}` : ""}
                                      </span>
                                    </span>
                                  </label>

                                  <div className="ml-auto flex flex-wrap items-center gap-2">
                                    <select
                                      value={certificateType}
                                      onChange={handleTemplateChange(participant.key)}
                                      className="rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
                                    >
                                      <option value="participation">Participation</option>
                                      <option value="winner">Winner</option>
                                    </select>
                                    {certificateType === "winner" ? (
                                      <select
                                        value={position}
                                        onChange={handlePositionChange(participant.key)}
                                        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
                                      >
                                        <option value="">Position</option>
                                        <option value="1st">1st</option>
                                        <option value="2nd">2nd</option>
                                        <option value="3rd">3rd</option>
                                      </select>
                                    ) : (
                                      <span className="text-[10px] text-slate-400">Position N/A</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div className="mt-3 flex items-center justify-end">
                            <button
                              type="button"
                              onClick={handleIssueSelected}
                              disabled={issuingSelected || selectedCount === 0}
                              className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                            >
                              {issuingSelected ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                              {issuingSelected ? "Issuing..." : "Issue Selected"}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </article>
              </div>

              <aside className="space-y-4">
                <article className="eventmate-panel rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-gray-900/70 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-300">Recently Issued</p>
                    <button
                      type="button"
                      onClick={() => load({ silent: true })}
                      className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-300 hover:text-indigo-700 dark:hover:text-indigo-200 inline-flex items-center gap-1"
                    >
                      {refreshing ? <Loader2 size={12} className="animate-spin" /> : <Clock3 size={12} />}
                      View All
                    </button>
                  </div>

                  <div className="mt-3 space-y-2">
                    {recentIssued.length === 0 ? (
                      <p className="text-xs text-slate-500 dark:text-slate-300">No certificates issued yet for this event.</p>
                    ) : (
                      recentIssued.map((item) => (
                        <div key={item.id} className="flex items-center justify-between gap-2 rounded-md border border-slate-200 dark:border-white/10 px-2.5 py-2">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{item.participantName}</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-300 truncate">{formatDateTime(item.issuedAt)}</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                              Sent
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDownload(item.participantEmail)}
                              className="inline-flex items-center justify-center rounded-md border border-slate-200 dark:border-white/10 p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
                              title="Download"
                            >
                              <Download size={12} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </article>

                <article className="eventmate-panel rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-gray-900/70 p-4">
                  <p className="text-xs text-slate-500 dark:text-slate-300 inline-flex items-center gap-1.5">
                    <CalendarDays size={12} />
                    Event Date: {getEventDateLabel(eventData)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
                    Venue: {eventData?.venue?.location || eventData?.venue?.mode || "TBD"}
                  </p>
                </article>
              </aside>
            </section>
          </>
        )}

        {isCustomizeDialogOpen && (
          <section className="fixed inset-0 z-50 bg-slate-900/60 px-4 py-8 overflow-y-auto">
            <div className="mx-auto w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-2xl">
              <div className="border-b border-slate-200 dark:border-white/10 px-5 py-4">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Customize Certificate Fields</h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
                  Changes are saved for this event and used in generated certificates.
                </p>
              </div>

              <div className="max-h-[70vh] overflow-y-auto px-5 py-4 space-y-5">
                <section className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/5 p-3">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Background Image</p>
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-300">
                    Upload a new background image or set a public image URL.
                  </p>
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-2 items-start">
                    <input
                      type="url"
                      value={draftCustomization.backgroundImageUrl || ""}
                      maxLength={CERTIFICATE_CUSTOMIZATION_LIMITS.backgroundImageUrl}
                      onChange={(eventValue) =>
                        handleDraftCustomizationChange("backgroundImageUrl", eventValue.target.value)
                      }
                      placeholder="https://example.com/certificate-background.jpg"
                      className="w-full rounded-md border border-slate-300 dark:border-white/15 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                    <button
                      type="button"
                      onClick={triggerBackgroundPicker}
                      disabled={uploadingBackground || savingCustomization}
                      className="rounded-md border border-slate-300 dark:border-white/15 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-60"
                    >
                      {uploadingBackground ? "Uploading..." : "Upload Image"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDraftCustomizationChange("backgroundImageUrl", "")}
                      disabled={savingCustomization}
                      className="rounded-md border border-slate-300 dark:border-white/15 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-60"
                    >
                      Clear
                    </button>
                  </div>
                </section>

                <section>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Text Content</p>
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {CUSTOMIZATION_FIELDS.map((field) => (
                      <label key={field.key} className="space-y-1.5">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{field.label}</span>
                        <input
                          type="text"
                          value={draftCustomization[field.key] || ""}
                          maxLength={CERTIFICATE_CUSTOMIZATION_LIMITS[field.key]}
                          onChange={(eventValue) => handleDraftCustomizationChange(field.key, eventValue.target.value)}
                          className="w-full rounded-md border border-slate-300 dark:border-white/15 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                        {field.hint ? (
                          <p className="text-[11px] text-slate-500 dark:text-slate-300">{field.hint}</p>
                        ) : null}
                      </label>
                    ))}
                  </div>
                </section>

                <section>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Rearrange Positions</p>
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-300">
                    Drag elements directly on the canvas, or fine tune with X/Y values below.
                  </p>
                  <div className="mt-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-white/5 p-3">
                    <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      Drag Editor {draggingLayoutKey ? `- Moving ${draggingLayoutKey}` : ""}
                    </p>
                    <div
                      ref={dragCanvasRef}
                      className="relative mt-2 w-full overflow-hidden rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-slate-900/70 touch-none select-none"
                      style={{ aspectRatio: PREVIEW_RATIO }}
                    >
                      {draftCustomization.backgroundImageUrl ? (
                        <img
                          src={draftCustomization.backgroundImageUrl}
                          alt="Certificate background"
                          className="absolute inset-0 h-full w-full object-cover pointer-events-none"
                        />
                      ) : null}

                      <div className="absolute inset-0 border-[3px] border-violet-600 pointer-events-none" />
                      <div className="absolute inset-[8px] border border-pink-500/80 pointer-events-none" />
                      <div className="absolute left-[20px] right-[20px] top-[20px] h-[6px] bg-violet-600 pointer-events-none" />
                      <div className="absolute left-[20px] right-[20px] bottom-[20px] h-[6px] bg-pink-500 pointer-events-none" />

                      <button
                        type="button"
                        onPointerDown={handleDragCanvasPointerDown("logo")}
                        className="absolute px-1.5 py-0.5 rounded border border-transparent bg-white/70 text-[10px] font-semibold tracking-[0.14em] text-violet-700/90 uppercase hover:border-violet-300 cursor-grab active:cursor-grabbing"
                        style={{
                          left: `${draftCustomization.layout.logo.x}%`,
                          top: `${draftCustomization.layout.logo.y}%`,
                          transform: getPreviewTransformByAnchor(draftCustomization.layout.logo.anchor),
                        }}
                      >
                        EventMate
                      </button>

                      <button
                        type="button"
                        onPointerDown={handleDragCanvasPointerDown("issuerName")}
                        className="absolute px-1.5 py-0.5 rounded border border-transparent bg-white/70 text-[9px] tracking-[0.1em] text-slate-500 uppercase whitespace-nowrap hover:border-violet-300 cursor-grab active:cursor-grabbing"
                        style={{
                          left: `${draftCustomization.layout.issuerName.x}%`,
                          top: `${draftCustomization.layout.issuerName.y}%`,
                          transform: getPreviewTransformByAnchor(draftCustomization.layout.issuerName.anchor),
                        }}
                      >
                        {draftCustomization.issuerName}
                      </button>

                      <button
                        type="button"
                        onPointerDown={handleDragCanvasPointerDown("title")}
                        className="absolute px-1.5 py-0.5 rounded border border-transparent bg-white/70 text-xl font-bold text-slate-800 whitespace-nowrap hover:border-violet-300 cursor-grab active:cursor-grabbing"
                        style={{
                          left: `${draftCustomization.layout.title.x}%`,
                          top: `${draftCustomization.layout.title.y}%`,
                          transform: getPreviewTransformByAnchor(draftCustomization.layout.title.anchor),
                        }}
                      >
                        {draftCustomization.participationTitle}
                      </button>

                      <button
                        type="button"
                        onPointerDown={handleDragCanvasPointerDown("introText")}
                        className="absolute px-1.5 py-0.5 rounded border border-transparent bg-white/70 text-[11px] text-slate-600 whitespace-nowrap hover:border-violet-300 cursor-grab active:cursor-grabbing"
                        style={{
                          left: `${draftCustomization.layout.introText.x}%`,
                          top: `${draftCustomization.layout.introText.y}%`,
                          transform: getPreviewTransformByAnchor(draftCustomization.layout.introText.anchor),
                        }}
                      >
                        {draftCustomization.introText}
                      </button>

                      <button
                        type="button"
                        onPointerDown={handleDragCanvasPointerDown("participantName")}
                        className="absolute px-1.5 py-0.5 rounded border border-transparent bg-white/70 text-2xl font-bold text-violet-700 whitespace-nowrap hover:border-violet-300 cursor-grab active:cursor-grabbing"
                        style={{
                          left: `${draftCustomization.layout.participantName.x}%`,
                          top: `${draftCustomization.layout.participantName.y}%`,
                          transform: getPreviewTransformByAnchor(draftCustomization.layout.participantName.anchor),
                        }}
                      >
                        {`{Student Name}`}
                      </button>

                      <button
                        type="button"
                        onPointerDown={handleDragCanvasPointerDown("actionText")}
                        className="absolute px-1.5 py-0.5 rounded border border-transparent bg-white/70 text-[11px] text-slate-600 whitespace-nowrap hover:border-violet-300 cursor-grab active:cursor-grabbing"
                        style={{
                          left: `${draftCustomization.layout.actionText.x}%`,
                          top: `${draftCustomization.layout.actionText.y}%`,
                          transform: getPreviewTransformByAnchor(draftCustomization.layout.actionText.anchor),
                        }}
                      >
                        {draftCustomization.participationActionText}
                      </button>

                      <button
                        type="button"
                        onPointerDown={handleDragCanvasPointerDown("eventName")}
                        className="absolute px-1.5 py-0.5 rounded border border-transparent bg-white/70 text-lg font-bold text-slate-900 whitespace-nowrap hover:border-violet-300 cursor-grab active:cursor-grabbing"
                        style={{
                          left: `${draftCustomization.layout.eventName.x}%`,
                          top: `${draftCustomization.layout.eventName.y}%`,
                          transform: getPreviewTransformByAnchor(draftCustomization.layout.eventName.anchor),
                        }}
                      >
                        {eventData?.title || "Event"}
                      </button>

                      <button
                        type="button"
                        onPointerDown={handleDragCanvasPointerDown("dateVenue")}
                        className="absolute px-1.5 py-0.5 rounded border border-transparent bg-white/70 text-[10px] text-slate-500 whitespace-nowrap hover:border-violet-300 cursor-grab active:cursor-grabbing"
                        style={{
                          left: `${draftCustomization.layout.dateVenue.x}%`,
                          top: `${draftCustomization.layout.dateVenue.y}%`,
                          transform: getPreviewTransformByAnchor(draftCustomization.layout.dateVenue.anchor),
                        }}
                      >
                        {`${getEventDateLabel(eventData)} - ${eventData?.venue?.location || eventData?.venue?.mode || "TBD"}`}
                      </button>

                      <button
                        type="button"
                        onPointerDown={handleDragCanvasPointerDown("coordinatorLabel")}
                        className="absolute px-1.5 py-0.5 rounded border border-transparent bg-white/70 text-[10px] text-slate-700 whitespace-nowrap hover:border-violet-300 cursor-grab active:cursor-grabbing"
                        style={{
                          left: `${draftCustomization.layout.coordinatorLabel.x}%`,
                          top: `${draftCustomization.layout.coordinatorLabel.y}%`,
                          transform: getPreviewTransformByAnchor(draftCustomization.layout.coordinatorLabel.anchor),
                        }}
                      >
                        {draftCustomization.coordinatorLabel}
                      </button>

                      <button
                        type="button"
                        onPointerDown={handleDragCanvasPointerDown("principalLabel")}
                        className="absolute px-1.5 py-0.5 rounded border border-transparent bg-white/70 text-[10px] text-slate-700 whitespace-nowrap hover:border-violet-300 cursor-grab active:cursor-grabbing"
                        style={{
                          left: `${draftCustomization.layout.principalLabel.x}%`,
                          top: `${draftCustomization.layout.principalLabel.y}%`,
                          transform: getPreviewTransformByAnchor(draftCustomization.layout.principalLabel.anchor),
                        }}
                      >
                        {draftCustomization.principalLabel}
                      </button>

                      <button
                        type="button"
                        onPointerDown={handleDragCanvasPointerDown("footerText")}
                        className="absolute px-1.5 py-0.5 rounded border border-transparent bg-white/70 text-[9px] text-slate-500 whitespace-nowrap hover:border-violet-300 cursor-grab active:cursor-grabbing"
                        style={{
                          left: `${draftCustomization.layout.footerText.x}%`,
                          top: `${draftCustomization.layout.footerText.y}%`,
                          transform: getPreviewTransformByAnchor(draftCustomization.layout.footerText.anchor),
                        }}
                      >
                        {draftCustomization.footerText}
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 space-y-2">
                    {LAYOUT_FIELDS.map((field) => {
                      const node = draftCustomization.layout?.[field.key] || createDefaultCertificateLayout()[field.key];
                      return (
                        <div
                          key={field.key}
                          className="rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 p-2.5 grid grid-cols-1 sm:grid-cols-[minmax(120px,1fr)_88px_88px_112px_88px] gap-2 items-center"
                        >
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{field.label}</p>

                          <label className="space-y-0.5">
                            <span className="text-[10px] text-slate-500 dark:text-slate-300">X</span>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={node.x}
                              onChange={(eventValue) => handleDraftLayoutChange(field.key, "x", eventValue.target.value)}
                              className="w-full rounded-md border border-slate-300 dark:border-white/15 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                            />
                          </label>

                          <label className="space-y-0.5">
                            <span className="text-[10px] text-slate-500 dark:text-slate-300">Y</span>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={node.y}
                              onChange={(eventValue) => handleDraftLayoutChange(field.key, "y", eventValue.target.value)}
                              className="w-full rounded-md border border-slate-300 dark:border-white/15 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                            />
                          </label>

                          <label className="space-y-0.5">
                            <span className="text-[10px] text-slate-500 dark:text-slate-300">Anchor</span>
                            <select
                              value={node.anchor}
                              onChange={(eventValue) => handleDraftLayoutChange(field.key, "anchor", eventValue.target.value)}
                              className="w-full rounded-md border border-slate-300 dark:border-white/15 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                            >
                              <option value="left">Left</option>
                              <option value="center">Center</option>
                              <option value="right">Right</option>
                            </select>
                          </label>

                          {field.hasWidth ? (
                            <label className="space-y-0.5">
                              <span className="text-[10px] text-slate-500 dark:text-slate-300">Width</span>
                              <input
                                type="number"
                                min="60"
                                max="320"
                                step="1"
                                value={node.width || 120}
                                onChange={(eventValue) =>
                                  handleDraftLayoutChange(field.key, "width", eventValue.target.value)
                                }
                                className="w-full rounded-md border border-slate-300 dark:border-white/15 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                              />
                            </label>
                          ) : (
                            <div />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>

              <div className="border-t border-slate-200 dark:border-white/10 px-5 py-4 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleResetCustomization}
                  disabled={savingCustomization || uploadingBackground}
                  className="rounded-md border border-slate-300 dark:border-white/15 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-60"
                >
                  Reset Defaults
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCloseCustomizationDialog}
                    disabled={savingCustomization || uploadingBackground}
                    className="rounded-md border border-slate-300 dark:border-white/15 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCustomization}
                    disabled={savingCustomization || uploadingBackground}
                    className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {savingCustomization ? <Loader2 size={12} className="animate-spin" /> : null}
                    {savingCustomization ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </section>
  );
}

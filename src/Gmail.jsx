import { useState, useEffect, useRef, useMemo, forwardRef, useImperativeHandle } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import {
  MdInbox,
  MdStar,
  MdStarBorder,
  MdSchedule,
  MdSend,
  MdDrafts,
  MdDelete,
  MdSearch,
  MdEdit,
  MdAttachFile,
  MdArrowBack,
  MdReply,
  MdForward,
  MdArchive,
  MdMarkEmailRead,
  MdMarkEmailUnread,
  MdClose,
  MdMenu,
  MdLabel,
  MdArrowDropDown,
  MdMoreVert,
  MdRefresh,
  MdKeyboardArrowDown,
  MdKeyboardArrowUp,
  MdKeyboardArrowLeft,
  MdKeyboardArrowRight,
  MdDownload,
  MdInsertDriveFile,
  MdImage,
  MdPictureAsPdf,
  MdUnsubscribe,
  MdAccessTime,
  MdVerified,
  MdReport,
  MdDriveFileMove,
  MdOutbox,
  MdRemove,
  MdOpenInFull,
  MdCloseFullscreen,
  MdFormatBold,
  MdFormatItalic,
  MdFormatUnderlined,
  MdFormatStrikethrough,
  MdFormatListBulleted,
  MdFormatListNumbered,
  MdFormatIndentIncrease,
  MdFormatIndentDecrease,
  MdFormatAlignLeft,
  MdFormatAlignCenter,
  MdFormatAlignRight,
  MdFormatColorText,
  MdFormatClear,
  MdInsertLink,
  MdFormatQuote,
  MdUndo,
  MdRedo,
  MdTune,
  MdHelpOutline,
  MdSettings,
  MdAdd,
  MdDraw,
  MdVisibility,
} from "react-icons/md";

pdfjs.GlobalWorkerOptions.workerSrc = `${import.meta.env.BASE_URL}pdf.worker.min.js`;

const API_URL = import.meta.env.VITE_API_URL || "";

const LABEL_STYLES = {};

const NAV_ITEMS = [
  { icon: MdInbox, label: "Inbox" },
  { icon: MdStar, label: "Starred" },
  { icon: MdSchedule, label: "Snoozed" },
  { icon: MdSend, label: "Sent" },
  { icon: MdDrafts, label: "Drafts" },
];

const NAV_ITEMS_MORE = [
  { icon: MdReport, label: "Spam" },
  { icon: MdDelete, label: "Trash" },
];

const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com", "googlemail.com",
  "yahoo.com", "yahoo.co.uk", "yahoo.fr", "yahoo.de", "yahoo.es", "yahoo.co.jp",
  "hotmail.com", "hotmail.co.uk", "hotmail.fr", "hotmail.de",
  "outlook.com", "outlook.fr", "outlook.de",
  "live.com", "live.co.uk", "live.fr",
  "icloud.com", "me.com", "mac.com",
  "aol.com",
  "protonmail.com", "proton.me", "pm.me",
  "mail.com", "gmx.com", "gmx.de", "gmx.net",
  "yandex.com", "yandex.ru",
  "msn.com", "inbox.com",
]);

function isBusinessEmail(emailStr) {
  if (!emailStr) return false;
  const domain = emailStr.split("@")[1]?.toLowerCase();
  if (!domain) return false;
  return !FREE_EMAIL_DOMAINS.has(domain);
}

function Tooltip({ label, children, position = "bottom", variant = "dark" }) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);

  const show = () => { timerRef.current = setTimeout(() => setVisible(true), 500); };
  const hide = () => { clearTimeout(timerRef.current); setVisible(false); };

  const isLight = variant === "light";

  return (
    <div
      style={{ position: "relative", display: "inline-flex" }}
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      {children}
      {visible && (
        <div style={{
          position: "absolute",
          ...(position === "bottom"
            ? { top: "calc(100% + 8px)" }
            : { bottom: "calc(100% + 8px)" }),
          left: "50%",
          transform: "translateX(-50%)",
          background: isLight ? "#fff" : "#3c4043",
          color: isLight ? "#202124" : "#fff",
          fontSize: 12,
          fontWeight: 400,
          padding: isLight ? "10px 14px" : "5px 10px",
          borderRadius: isLight ? 8 : 4,
          whiteSpace: isLight ? "normal" : "nowrap",
          maxWidth: isLight ? 260 : "none",
          pointerEvents: "none",
          zIndex: 9999,
          lineHeight: "18px",
          boxShadow: isLight
            ? "0 2px 8px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06)"
            : "0 1px 4px rgba(0,0,0,0.3)",
          letterSpacing: "0.01em",
        }}>
          {label}
        </div>
      )}
    </div>
  );
}

function VerificationBadge({ domain }) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);

  const show = () => { timerRef.current = setTimeout(() => setVisible(true), 250); };
  const hide = () => { clearTimeout(timerRef.current); setVisible(false); };

  return (
    <div style={{ position: "relative", display: "inline-flex" }} onMouseEnter={show} onMouseLeave={hide}>
      <MdVerified size={16} color="#1a73e8" style={{ cursor: "default", flexShrink: 0 }} />
      {visible && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 8px)",
          left: -8,
          background: "#fff",
          borderRadius: 8,
          boxShadow: "0 4px 12px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.07)",
          padding: "12px 14px",
          zIndex: 9999,
          pointerEvents: "none",
          width: 248,
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
        }}>
          <MdVerified size={22} color="#1a73e8" style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 13, color: "#202124", lineHeight: "19px", fontFamily: "Google Sans, Roboto, sans-serif" }}>
            The sender of this email has verified that they own{" "}
            <b>{domain}</b> and the logo in the profile image.
          </span>
        </div>
      )}
    </div>
  );
}

function AvatarMenu({ userEmail, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const initials = userEmail ? userEmail[0].toUpperCase() : "?";

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", flexShrink: 0 }}>
      <div
        onClick={() => setOpen(v => !v)}
        style={{
          width: 36, height: 36, borderRadius: "50%",
          background: "#1a73e8", color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, fontWeight: 600, cursor: "pointer",
          userSelect: "none",
        }}
      >
        {initials}
      </div>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0,
          background: "#fff", borderRadius: 12,
          boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
          minWidth: 260, zIndex: 3000, overflow: "hidden",
          padding: "16px 0 8px",
        }}>
          {/* Account info */}
          <div style={{ padding: "0 20px 16px", borderBottom: "1px solid #e0e0e0", textAlign: "center" }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: "#1a73e8", color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, fontWeight: 600, margin: "0 auto 10px",
            }}>
              {initials}
            </div>
            <div style={{ fontSize: 15, fontWeight: 500, color: "#202124" }}>
              {userEmail?.split("@")[0]}
            </div>
            <div style={{ fontSize: 13, color: "#5f6368", marginTop: 2 }}>
              {userEmail}
            </div>
          </div>

          {/* Sign out */}
          <div
            onClick={onLogout}
            style={{
              padding: "10px 20px", fontSize: 14, color: "#202124",
              cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#f1f3f4"}
            onMouseLeave={e => e.currentTarget.style.background = "none"}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5f6368" strokeWidth="2" strokeLinecap="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sign out
          </div>
        </div>
      )}
    </div>
  );
}

function Avatar({ initials, color, size = 36 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size < 32 ? 11 : 13,
        fontWeight: 600,
        flexShrink: 0,
        letterSpacing: "0.02em",
      }}
    >
      {initials}
    </div>
  );
}

function SenderAvatar({
  senderEmail,
  initials,
  color,
  size = 40,
  onVerified,
}) {
  const domain = senderEmail ? senderEmail.split("@")[1] : "";
  const logoUrl = domain
    ? `${API_URL}/logo?domain=${domain}&email=${encodeURIComponent(senderEmail || "")}`
    : "";

  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  // Reset when we open a different email (key prop handles this, but guard anyway)
  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [senderEmail]);

  const handleLoad = () => {
    setLoaded(true);
    if (isBusinessEmail(senderEmail) && onVerified) onVerified(true);
  };

  const isVerifiedBrand = loaded && isBusinessEmail(senderEmail);

  // No domain or all sources failed → coloured initials, no badge
  if (failed || !domain) {
    return (
      <div style={{ position: "relative", flexShrink: 0, width: size, height: size }}>
        <Avatar initials={initials} color={color} size={size} />
      </div>
    );
  }

  return (
    <div style={{ position: "relative", flexShrink: 0, width: size, height: size }}>
      {/* Show initials until the logo resolves */}
      {!loaded && <Avatar initials={initials} color={color} size={size} />}

      <img
        key={logoUrl}
        src={logoUrl}
        onLoad={handleLoad}
        onError={() => setFailed(true)}
        alt=""
        style={{
          position: loaded ? "static" : "absolute",
          opacity: loaded ? 1 : 0,
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          border: "0.5px solid #e0e0e0",
          background: "#fff",
          display: "block",
        }}
      />
    </div>
  );
}

function useContactSuggestions(query, preloaded) {
  return useMemo(() => {
    if (!query || query.length < 1 || preloaded.length === 0) return [];
    const lower = query.toLowerCase();
    return preloaded
      .filter(
        (c) =>
          c.name.toLowerCase().includes(lower) ||
          c.email.toLowerCase().includes(lower),
      )
      .slice(0, 10);
  }, [query, preloaded]);
}

function ToField({ recipients, onChange, preloaded }) {
  const [inputVal, setInputVal] = useState("");
  const [activeIdx, setActiveIdx] = useState(-1);
  const [open, setOpen] = useState(false);
  const suggestions = useContactSuggestions(inputVal, preloaded);
  const inputRef = useRef(null);

  useEffect(() => {
    setOpen(suggestions.length > 0 && inputVal.length > 0);
    setActiveIdx(-1);
  }, [suggestions, inputVal]);

  const addRecipient = (contact) => {
    if (!recipients.find((r) => r.email === contact.email)) {
      onChange([...recipients, contact]);
    }
    setInputVal("");
    setOpen(false);
    inputRef.current?.focus();
  };

  const commitInput = () => {
    const val = inputVal.trim();
    if (!val) return;
    // treat bare input as email
    const contact = {
      name: val.includes("@") ? val.split("@")[0] : val,
      email: val,
    };
    addRecipient(contact);
  };

  const removeRecipient = (email) =>
    onChange(recipients.filter((r) => r.email !== email));

  const handleKeyDown = (e) => {
    if (open && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, 0));
        return;
      }
      if ((e.key === "Enter" || e.key === "Tab") && activeIdx >= 0) {
        e.preventDefault();
        addRecipient(suggestions[activeIdx]);
        return;
      }
    }
    if (e.key === "Enter" || e.key === "Tab" || e.key === ",") {
      e.preventDefault();
      if (open && activeIdx >= 0) {
        addRecipient(suggestions[activeIdx]);
        return;
      }
      commitInput();
    }
    if (e.key === "Backspace" && inputVal === "" && recipients.length > 0) {
      onChange(recipients.slice(0, -1));
    }
    if (e.key === "Escape") {
      setOpen(false);
    }
  };

  // color from first char
  const chipColor = (email) => {
    const colors = [
      "#1a73e8",
      "#34a853",
      "#fbbc04",
      "#ea4335",
      "#9334e6",
      "#00897b",
      "#e91e63",
    ];
    return colors[email.charCodeAt(0) % colors.length];
  };

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 4,
        flex: 1,
      }}
    >
      {recipients.map((r) => (
        <span
          key={r.email}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            background: "#e8f0fe",
            borderRadius: 16,
            padding: "2px 4px 2px 2px",
            fontSize: 13,
            color: "#1967d2",
            maxWidth: 220,
          }}
        >
          <span
            style={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: chipColor(r.email),
              color: "#fff",
              fontSize: 10,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {r.name.charAt(0).toUpperCase()}
          </span>
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {r.name}
          </span>
          <button
            onClick={() => removeRecipient(r.email)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "0 2px",
              color: "#1967d2",
              display: "flex",
              alignItems: "center",
              lineHeight: 1,
            }}
          >
            <MdClose size={13} />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        value={inputVal}
        onChange={(e) => setInputVal(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          setTimeout(() => setOpen(false), 150);
          if (inputVal.trim()) commitInput();
        }}
        onFocus={() => {
          if (suggestions.length > 0 && inputVal) setOpen(true);
        }}
        style={{
          border: "none",
          outline: "none",
          fontSize: 13,
          color: "#202124",
          background: "transparent",
          fontFamily: "inherit",
          minWidth: 120,
          flex: 1,
        }}
        placeholder={recipients.length === 0 ? "Recipients" : ""}
      />
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "#fff",
            borderRadius: 8,
            boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
            zIndex: 400,
            overflow: "hidden",
            border: "1px solid #e0e0e0",
          }}
        >
          {suggestions.map((s, i) => (
            <div
              key={s.email}
              onMouseDown={() => addRecipient(s)}
              onMouseEnter={() => setActiveIdx(i)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "8px 16px",
                cursor: "pointer",
                background: i === activeIdx ? "#f1f3f4" : "#fff",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: chipColor(s.email),
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {s.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div
                  style={{ fontSize: 13, color: "#202124", fontWeight: 500 }}
                >
                  {s.name}
                </div>
                <div style={{ fontSize: 12, color: "#5f6368" }}>{s.email}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const EMOJI_LIST = [
  "😀","😁","😂","🤣","😃","😄","😅","😆","😉","😊","😋","😎","😍","🥰","😘",
  "😗","😙","😚","🙂","🤗","🤩","🤔","🤨","😐","😑","😶","🙄","😏","😣","😥",
  "😮","🤐","😯","😪","😫","🥱","😴","😌","😛","😜","😝","🤤","😒","😓","😔",
  "😕","🙃","🤑","😲","☹️","🙁","😖","😞","😟","😤","😢","😭","😦","😧","😨",
  "😩","🤯","😬","😰","😱","🥵","🥶","😳","🤪","😵","😡","😠","🤬","😷","🤒",
  "🤕","🤢","🤮","🤧","😇","🥳","🥺","🤠","🤡","🤥","🤫","🤭","🧐","🤓","😈",
  "👋","🤚","🖐","✋","🖖","👌","🤌","🤏","✌️","🤞","🤟","🤘","🤙","👈","👉",
  "👆","👇","☝️","👍","👎","✊","👊","🤛","🤜","👏","🙌","👐","🤲","🤝",
  "🙏","❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❤️‍🔥","❤️‍🩹","💕",
  "🎉","🎊","🎈","🎁","🎂","🍕","🍔","🍟","🌮","🍜","🍣","🍦","🍩","🍪","☕",
];

const RichTextEditor = forwardRef(function RichTextEditor({ onChange, fullscreen, showToolbar, initialHTML }, ref) {
  const editorRef = useRef(null);
  const colorInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const [formats, setFormats] = useState({});
  const [fontSize, setFontSize] = useState("3");
  const [fontName, setFontName] = useState("Arial, sans-serif");
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState("https://");
  const [linkText, setLinkText] = useState("");
  const [savedRange, setSavedRange] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedImg, setSelectedImg] = useState(null);
  const [imgToolbarPos, setImgToolbarPos] = useState({ top: 0, left: 0 });
  const imgToolbarRef = useRef(null);
  const linkDialogRef = useRef(null);
  const emojiPickerRef = useRef(null);

  useEffect(() => {
    if (initialHTML && editorRef.current) {
      editorRef.current.innerHTML = initialHTML;
      onChange(initialHTML);
      // Place cursor at the very start so the user types above the prepopulated content
      try {
        const range = document.createRange();
        const sel = window.getSelection();
        range.setStart(editorRef.current, 0);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      } catch (_) {}
      editorRef.current.focus();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateFormats = () => {
    setFormats({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      strikeThrough: document.queryCommandState("strikeThrough"),
      insertOrderedList: document.queryCommandState("insertOrderedList"),
      insertUnorderedList: document.queryCommandState("insertUnorderedList"),
      justifyLeft: document.queryCommandState("justifyLeft"),
      justifyCenter: document.queryCommandState("justifyCenter"),
      justifyRight: document.queryCommandState("justifyRight"),
    });
  };

  const exec = (cmd, val = null) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    updateFormats();
    onChange(editorRef.current?.innerHTML || "");
  };

  // Save current selection so it can be restored after a popover steals focus
  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) setSavedRange(sel.getRangeAt(0).cloneRange());
  };

  const restoreSelection = () => {
    if (!savedRange) return;
    editorRef.current?.focus();
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(savedRange);
  };

  // Close popovers + image toolbar on outside click
  useEffect(() => {
    const handler = (e) => {
      if (linkDialogRef.current && !linkDialogRef.current.contains(e.target)) setShowLinkDialog(false);
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) setShowEmojiPicker(false);
      if (imgToolbarRef.current && !imgToolbarRef.current.contains(e.target) && e.target.tagName !== "IMG") setSelectedImg(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Detect image click inside editor
  const handleEditorClick = (e) => {
    updateFormats();
    if (e.target.tagName === "IMG") {
      const img = e.target;
      const rect = img.getBoundingClientRect();
      setSelectedImg(img);
      setImgToolbarPos({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX });
    } else {
      setSelectedImg(null);
    }
  };

  const applyImageSize = (size) => {
    if (!selectedImg) return;
    if (size === "small") {
      selectedImg.style.width = "200px";
      selectedImg.style.maxWidth = "200px";
      selectedImg.style.height = "auto";
    } else if (size === "bestfit") {
      selectedImg.style.width = "100%";
      selectedImg.style.maxWidth = "100%";
      selectedImg.style.height = "auto";
    } else {
      selectedImg.style.width = "";
      selectedImg.style.maxWidth = "none";
      selectedImg.style.height = "";
    }
    onChange(editorRef.current?.innerHTML || "");
    // Reposition toolbar after resize
    const rect = selectedImg.getBoundingClientRect();
    setImgToolbarPos({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX });
  };

  const handleInput = () => {
    updateFormats();
    onChange(editorRef.current?.innerHTML || "");
  };

  const btn = (cmd, icon, title, val = null) => (
    <button
      key={cmd + (val || "")}
      title={title}
      onMouseDown={(e) => {
        e.preventDefault();
        exec(cmd, val);
      }}
      style={{
        background: formats[cmd] ? "#e8f0fe" : "none",
        border: "none",
        cursor: "pointer",
        padding: "3px 5px",
        borderRadius: 4,
        color: formats[cmd] ? "#1967d2" : "#444746",
        display: "flex",
        alignItems: "center",
        flexShrink: 0,
        transition: "background 0.1s",
      }}
      onMouseEnter={(e) => {
        if (!formats[cmd]) e.currentTarget.style.background = "#f1f3f4";
      }}
      onMouseLeave={(e) => {
        if (!formats[cmd]) e.currentTarget.style.background = "none";
      }}
    >
      {icon}
    </button>
  );

  const Divider = () => (
    <div
      style={{
        width: 1,
        height: 18,
        background: "#e0e0e0",
        margin: "0 3px",
        flexShrink: 0,
      }}
    />
  );

  const selStyle = {
    border: "none",
    background: "none",
    fontSize: 12,
    color: "#444746",
    cursor: "pointer",
    outline: "none",
    padding: "2px 4px",
    borderRadius: 4,
    fontFamily: "Google Sans, Roboto, sans-serif",
  };

  // Expose trigger methods to ComposeModal via ref
  useImperativeHandle(ref, () => ({
    openLinkDialog() { saveSelection(); setShowLinkDialog(true); setShowEmojiPicker(false); },
    openEmojiPicker() { saveSelection(); setShowEmojiPicker(true); setShowLinkDialog(false); },
    triggerImageInsert() { saveSelection(); imageInputRef.current?.click(); },
    appendToEnd(html) {
      if (!editorRef.current) return;
      editorRef.current.innerHTML += html;
      onChange(editorRef.current.innerHTML);
    },
    getHTML() { return editorRef.current?.innerHTML || ""; },
  }));

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: fullscreen ? 1 : "none",
        minHeight: 0,
      }}
    >
      {/* Editor area — always visible */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyUp={updateFormats}
        onMouseUp={handleEditorClick}
        onClick={handleEditorClick}
        data-placeholder="Write your message..."
        style={{
          flex: fullscreen ? 1 : "none",
          minHeight: fullscreen ? "unset" : 190,
          maxHeight: fullscreen ? "unset" : 260,
          padding: "12px 16px",
          outline: "none",
          fontSize: 14,
          color: "#202124",
          background: "#fff",
          lineHeight: 1.6,
          overflowY: "auto",
          fontFamily: "Arial, sans-serif",
        }}
      />

      {/* Toolbar — only in fullscreen, pinned above the action bar */}
      {showToolbar && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 1,
            padding: "4px 8px",
            borderTop: "1px solid #e0e0e0",
            background: "#fff",
            flexShrink: 0,
          }}
        >
          {/* Undo / Redo */}
          <button
            title="Undo (Ctrl+Z)"
            onMouseDown={(e) => {
              e.preventDefault();
              exec("undo");
            }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "3px 5px",
              borderRadius: 4,
              color: "#444746",
              display: "flex",
              alignItems: "center",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f3f4")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            <MdUndo size={18} />
          </button>
          <button
            title="Redo (Ctrl+Y)"
            onMouseDown={(e) => {
              e.preventDefault();
              exec("redo");
            }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "3px 5px",
              borderRadius: 4,
              color: "#444746",
              display: "flex",
              alignItems: "center",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f3f4")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            <MdRedo size={18} />
          </button>

          <Divider />

          {/* Font family */}
          <select
            style={{ ...selStyle, maxWidth: 108 }}
            value={fontName}
            onMouseDown={(e) => e.stopPropagation()}
            onChange={(e) => {
              setFontName(e.target.value);
              exec("fontName", e.target.value);
            }}
          >
            <option value="Arial, sans-serif">Sans Serif</option>
            <option value="serif">Serif</option>
            <option value="'Courier New', monospace">Fixed Width</option>
            <option value="Georgia, serif">Georgia</option>
            <option value="Tahoma, sans-serif">Tahoma</option>
            <option value="Verdana, sans-serif">Verdana</option>
          </select>

          <Divider />

          {/* Font size */}
          <select
            style={{ ...selStyle, maxWidth: 64 }}
            value={fontSize}
            onMouseDown={(e) => e.stopPropagation()}
            onChange={(e) => {
              setFontSize(e.target.value);
              exec("fontSize", e.target.value);
            }}
          >
            <option value="1">Small</option>
            <option value="3">Normal</option>
            <option value="5">Large</option>
            <option value="7">Huge</option>
          </select>

          <Divider />

          {btn("bold", <MdFormatBold size={18} />, "Bold (Ctrl+B)")}
          {btn("italic", <MdFormatItalic size={18} />, "Italic (Ctrl+I)")}
          {btn(
            "underline",
            <MdFormatUnderlined size={18} />,
            "Underline (Ctrl+U)",
          )}
          {btn(
            "strikeThrough",
            <MdFormatStrikethrough size={18} />,
            "Strikethrough",
          )}

          <Divider />

          {/* Text color */}
          <button
            title="Text color"
            onMouseDown={(e) => {
              e.preventDefault();
              colorInputRef.current?.click();
            }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "3px 5px",
              borderRadius: 4,
              color: "#444746",
              display: "flex",
              alignItems: "center",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f3f4")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            <MdFormatColorText size={18} />
          </button>
          <input
            ref={colorInputRef}
            type="color"
            defaultValue="#000000"
            style={{ width: 0, height: 0, opacity: 0, position: "absolute" }}
            onChange={(e) => exec("foreColor", e.target.value)}
          />

          <Divider />

          {btn("justifyLeft", <MdFormatAlignLeft size={18} />, "Align left")}
          {btn(
            "justifyCenter",
            <MdFormatAlignCenter size={18} />,
            "Align center",
          )}
          {btn("justifyRight", <MdFormatAlignRight size={18} />, "Align right")}

          <Divider />

          {btn(
            "insertOrderedList",
            <MdFormatListNumbered size={18} />,
            "Numbered list",
          )}
          {btn(
            "insertUnorderedList",
            <MdFormatListBulleted size={18} />,
            "Bulleted list",
          )}

          <Divider />

          <button
            title="Decrease indent"
            onMouseDown={(e) => {
              e.preventDefault();
              exec("outdent");
            }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "3px 5px",
              borderRadius: 4,
              color: "#444746",
              display: "flex",
              alignItems: "center",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f3f4")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            <MdFormatIndentDecrease size={18} />
          </button>
          <button
            title="Increase indent"
            onMouseDown={(e) => {
              e.preventDefault();
              exec("indent");
            }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "3px 5px",
              borderRadius: 4,
              color: "#444746",
              display: "flex",
              alignItems: "center",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f3f4")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            <MdFormatIndentIncrease size={18} />
          </button>

          <Divider />

          <button
            title="Quote"
            onMouseDown={(e) => {
              e.preventDefault();
              exec("formatBlock", "blockquote");
            }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "3px 5px",
              borderRadius: 4,
              color: "#444746",
              display: "flex",
              alignItems: "center",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f3f4")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            <MdFormatQuote size={18} />
          </button>

          <Divider />

          <button
            title="Remove formatting"
            onMouseDown={(e) => {
              e.preventDefault();
              exec("removeFormat");
            }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "3px 5px",
              borderRadius: 4,
              color: "#444746",
              display: "flex",
              alignItems: "center",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f3f4")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            <MdFormatClear size={18} />
          </button>
        </div>
      )}

      {/* ── Always-mounted: image input + popovers (work regardless of toolbar state) ── */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={e => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = ev => {
            restoreSelection();
            exec("insertHTML", `<img src="${ev.target.result}" alt="${file.name}" style="max-width:100%;height:auto;border-radius:4px;margin:4px 0;" />`);
          };
          reader.readAsDataURL(file);
          e.target.value = "";
        }}
      />
      {showLinkDialog && (
        <div ref={linkDialogRef} style={{
          position: "fixed", bottom: 110, left: "50%", transform: "translateX(-50%)",
          zIndex: 500, background: "#fff", borderRadius: 8,
          boxShadow: "0 4px 16px rgba(0,0,0,0.22)", border: "1px solid #e0e0e0",
          padding: "14px 16px", width: 300,
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#202124", marginBottom: 10 }}>Insert link</div>
          <label style={{ fontSize: 12, color: "#5f6368" }}>Text to display</label>
          <input autoFocus value={linkText} onChange={e => setLinkText(e.target.value)} placeholder="Link text"
            style={{ display: "block", width: "100%", boxSizing: "border-box", marginTop: 4, marginBottom: 10, padding: "6px 10px", border: "1px solid #dadce0", borderRadius: 4, fontSize: 13, outline: "none", fontFamily: "inherit" }}
            onFocus={e => e.currentTarget.style.borderColor = "#1a73e8"}
            onBlur={e => e.currentTarget.style.borderColor = "#dadce0"} />
          <label style={{ fontSize: 12, color: "#5f6368" }}>Web address (URL)</label>
          <input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://"
            style={{ display: "block", width: "100%", boxSizing: "border-box", marginTop: 4, marginBottom: 14, padding: "6px 10px", border: "1px solid #dadce0", borderRadius: 4, fontSize: 13, outline: "none", fontFamily: "inherit" }}
            onFocus={e => e.currentTarget.style.borderColor = "#1a73e8"}
            onBlur={e => e.currentTarget.style.borderColor = "#dadce0"} />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button onClick={() => setShowLinkDialog(false)}
              style={{ padding: "6px 14px", borderRadius: 4, border: "1px solid #dadce0", background: "#fff", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
              onMouseEnter={e => e.currentTarget.style.background = "#f1f3f4"}
              onMouseLeave={e => e.currentTarget.style.background = "#fff"}>Cancel</button>
            <button onClick={() => {
                const url = linkUrl.trim();
                if (!url) return;
                restoreSelection();
                const sel = window.getSelection();
                if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
                  exec("createLink", url);
                } else {
                  const display = linkText.trim() || url;
                  exec("insertHTML", `<a href="${url}" target="_blank" rel="noopener noreferrer">${display}</a>`);
                }
                setShowLinkDialog(false);
              }}
              style={{ padding: "6px 14px", borderRadius: 4, border: "none", background: "#1a73e8", color: "#fff", fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}
              onMouseEnter={e => e.currentTarget.style.background = "#1765cc"}
              onMouseLeave={e => e.currentTarget.style.background = "#1a73e8"}>OK</button>
          </div>
        </div>
      )}
      {/* ── Image size toolbar — appears below a clicked image ── */}
      {selectedImg && (
        <div ref={imgToolbarRef} style={{
          position: "fixed",
          top: imgToolbarPos.top,
          left: imgToolbarPos.left,
          zIndex: 500,
          background: "#202124",
          borderRadius: 6,
          boxShadow: "0 2px 8px rgba(0,0,0,0.28)",
          display: "flex",
          alignItems: "center",
          padding: "2px 4px",
          gap: 2,
        }}>
          {[
            { label: "Small",    size: "small"   },
            { label: "Best fit", size: "bestfit" },
            { label: "Original", size: "original"},
          ].map(({ label, size }) => {
            const active =
              size === "small"    ? selectedImg.style.width === "200px" :
              size === "bestfit"  ? selectedImg.style.width === "100%" :
              size === "original" ? (!selectedImg.style.width || selectedImg.style.maxWidth === "none") :
              false;
            return (
              <button
                key={size}
                onMouseDown={e => e.preventDefault()}
                onClick={() => applyImageSize(size)}
                style={{
                  background: active ? "rgba(255,255,255,0.2)" : "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: active ? 600 : 400,
                  padding: "4px 10px",
                  borderRadius: 4,
                  fontFamily: "Google Sans, Roboto, sans-serif",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.12)"; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = "none"; }}
              >{label}</button>
            );
          })}
          <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.25)", margin: "0 2px" }} />
          <button
            onMouseDown={e => e.preventDefault()}
            onClick={() => { selectedImg.remove(); onChange(editorRef.current?.innerHTML || ""); setSelectedImg(null); }}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#fff", fontSize: 12, padding: "4px 8px", borderRadius: 4, fontFamily: "inherit" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
            onMouseLeave={e => e.currentTarget.style.background = "none"}
          >Remove</button>
        </div>
      )}

      {showEmojiPicker && (
        <div ref={emojiPickerRef} style={{
          position: "fixed", bottom: 110, left: "50%", transform: "translateX(-50%)",
          zIndex: 500, background: "#fff", borderRadius: 10,
          boxShadow: "0 4px 16px rgba(0,0,0,0.22)", border: "1px solid #e0e0e0",
          padding: 8, width: 220, maxHeight: 180, overflowY: "auto",
        }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {EMOJI_LIST.map((em, i) => (
              <button key={i} onMouseDown={e => e.preventDefault()}
                onClick={() => { restoreSelection(); exec("insertText", em); setShowEmojiPicker(false); }}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, padding: "2px 3px", borderRadius: 4, lineHeight: 1 }}
                onMouseEnter={e => e.currentTarget.style.background = "#f1f3f4"}
                onMouseLeave={e => e.currentTarget.style.background = "none"}
              >{em}</button>
            ))}
          </div>
        </div>
      )}

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9aa0a6;
          pointer-events: none;
        }
        [contenteditable] blockquote {
          margin: 4px 0 4px 16px;
          padding-left: 12px;
          border-left: 3px solid #dadce0;
          color: #5f6368;
        }
        [contenteditable] a { color: #1a73e8; text-decoration: underline; }
        [contenteditable] img { cursor: pointer; }
        [contenteditable] img:hover { outline: 2px solid #1a73e8; }
      `}</style>
    </div>
  );
});

function ComposeModal({ onClose, onPendingSend, initialDraft, minimized, onMinimize }) {
  const queryClient = useQueryClient();
  const [recipients, setRecipients] = useState(initialDraft?.recipients || []);
  const [cc, setCc]   = useState(initialDraft?.cc  || []);
  const [bcc, setBcc] = useState(initialDraft?.bcc || []);
  const [showCc, setShowCc]   = useState((initialDraft?.cc?.length  || 0) > 0);
  const [showBcc, setShowBcc] = useState((initialDraft?.bcc?.length || 0) > 0);
  const [subject, setSubject] = useState(initialDraft?.subject || "");
  const [body, setBody] = useState(initialDraft?.body || "");
  const [sending, setSending] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showFormatting, setShowFormatting] = useState(false);
  const [attachments, setAttachments] = useState(initialDraft?.attachments || []);
  const fileInputRef = useRef(null);
  const editorRef = useRef(null);
  const signaturePopoverRef = useRef(null);
  const signatureEditorRef = useRef(null);
  const signatureImageInputRef = useRef(null);
  const [preloadedContacts, setPreloadedContacts] = useState([]);
  const [showSignaturePopover, setShowSignaturePopover] = useState(false);
  const [signatureHtml, setSignatureHtml] = useState("");
  const [signatureId, setSignatureId] = useState(null);
  const [editingSignature, setEditingSignature] = useState(false);
  const signatureAppended = useRef(false);

  // Load default signature from backend and auto-append into editor on mount
  useEffect(() => {
    // If opening from a draft that already has a body, don't auto-append signature
    if (initialDraft?.body) return;
    fetch(`${API_URL}/signature`)
      .then(r => r.json())
      .then(data => {
        if (data.html) {
          setSignatureHtml(data.html);
          setSignatureId(data.id || null);
          if (!signatureAppended.current) {
            signatureAppended.current = true;
            const block = `<br/><div data-signature="1" style="padding-top:8px;margin-top:8px;font-size:13px">${data.html}</div>`;
            setTimeout(() => {
              if (editorRef.current?.appendToEnd) {
                editorRef.current.appendToEnd(block);
              }
            }, 0);
          }
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close signature popover on outside click
  useEffect(() => {
    const handler = (e) => {
      if (signaturePopoverRef.current && !signaturePopoverRef.current.contains(e.target)) {
        setShowSignaturePopover(false);
        setEditingSignature(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Pre-fetch top contacts as soon as the modal opens
  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/contacts`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setPreloadedContacts(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSend = () => {
    // Hand the draft to the parent — the parent delays the actual send
    // for 5 s so the user can click Undo.
    onPendingSend({ recipients, cc, bcc, subject, body, attachments, draftUid: initialDraft?.draftUid });
    onClose();
  };

  // Save current compose content to the IMAP Drafts folder
  const saveDraft = () => {
    // Read body directly from the DOM — React state can be stale if the
    // editor's last onChange hasn't caused a re-render yet (e.g. signature
    // was just appended or the user closed immediately after typing).
    const liveHtml = editorRef.current?.getHTML?.() || body;
    const liveText = liveHtml.replace(/<[^>]*>/g, "").trim();
    const hasContent =
      recipients.length > 0 ||
      subject.trim() ||
      liveText ||
      liveHtml.trim();

    // If opened from an existing draft, delete the original first so we
    // don't accumulate duplicates (whether or not we save new content).
    if (initialDraft?.draftUid) {
      fetch(`${API_URL}/emails/${initialDraft.draftUid}/trash?folder=drafts`, { method: "POST" }).catch(() => {});
    }

    if (!hasContent) return;

    const fd = new FormData();
    fd.append("to", recipients.map((r) => r.email).join(", "));
    if (cc.length)  fd.append("cc",  cc.map((r) => r.email).join(", "));
    if (bcc.length) fd.append("bcc", bcc.map((r) => r.email).join(", "));
    fd.append("subject", subject);
    fd.append("html", liveHtml);
    fd.append("text", liveText);
    attachments.forEach((f) => fd.append("attachments", f));

    fetch(`${API_URL}/emails/drafts`, { method: "POST", body: fd })
      .then(() => queryClient.invalidateQueries({ queryKey: ["emails", "Drafts"] }))
      .catch((err) => console.error("Save draft failed:", err));
  };

  const handleClose = () => {
    saveDraft();
    onClose();
  };

  const handleMinimize = () => {
    onMinimize();
    if (fullscreen) setFullscreen(false);
  };

  const handleFullscreen = () => {
    const next = !fullscreen;
    setFullscreen(next);
    if (next) setShowFormatting(true);   // always show toolbar in fullscreen
    if (minimized) onMinimize();
  };

  const fieldStyle = {
    display: "flex",
    alignItems: "center",
    borderBottom: "0.5px solid #e0e0e0",
    padding: "7px 16px",
    gap: 8,
  };
  const inputStyle = {
    border: "none",
    outline: "none",
    flex: 1,
    fontSize: 13,
    color: "#202124",
    background: "transparent",
    fontFamily: "inherit",
  };

  const containerStyle = fullscreen
    ? {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "min(860px, 90vw)",
        height: "min(600px, 90vh)",
        zIndex: 300,
        borderRadius: 8,
        overflow: "hidden",
        boxShadow: "0 8px 40px rgba(0,0,0,0.30)",
        border: "0.5px solid #ccc",
        background: "#fff",
        display: "flex",
        flexDirection: "column",
      }
    : {
        position: "fixed",
        bottom: 0,
        right: 24,
        width: 520,
        zIndex: 200,
        borderRadius: "12px 12px 0 0",
        overflow: "hidden",
        boxShadow: "0 8px 40px rgba(0,0,0,0.22)",
        border: "0.5px solid #ccc",
        background: "#fff",
        display: "flex",
        flexDirection: "column",
      };

  return (
    <>
      {fullscreen && (
        <div
          onClick={handleFullscreen}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            zIndex: 299,
          }}
        />
      )}
      <div style={containerStyle}>
        {/* Header */}
        <div
          style={{
            background: "#f2f6fc",
            color: "#202124",
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 14,
            fontWeight: 600,
            cursor: minimized ? "pointer" : "default",
            flexShrink: 0,
            borderBottom: minimized ? "none" : "1px solid #e0e0e0",
          }}
          onClick={minimized ? handleMinimize : undefined}
        >
          <span style={{ userSelect: "none" }}>
            {subject.trim() ? subject : "New Message"}
          </span>
          <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
            {/* Minimize */}
            <Tooltip label={minimized ? "Restore" : "Minimize"} position="bottom">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleMinimize();
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#444746",
                  display: "flex",
                  alignItems: "center",
                  padding: "4px 6px",
                  borderRadius: 4,
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(0,0,0,0.08)")
                }
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              >
                <MdRemove size={18} />
              </button>
            </Tooltip>
            {/* Fullscreen toggle */}
            <Tooltip label={fullscreen ? "Exit full screen" : "Full screen"} position="bottom">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleFullscreen();
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#444746",
                  display: "flex",
                  alignItems: "center",
                  padding: "4px 6px",
                  borderRadius: 4,
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(0,0,0,0.08)")
                }
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              >
                {fullscreen ? (
                  <MdCloseFullscreen size={16} />
                ) : (
                  <MdOpenInFull size={16} />
                )}
              </button>
            </Tooltip>
            {/* Close */}
            <Tooltip label="Save & close" position="bottom">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClose();
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#444746",
                  display: "flex",
                  alignItems: "center",
                  padding: "4px 6px",
                  borderRadius: 4,
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(0,0,0,0.08)")
                }
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              >
                <MdClose size={18} />
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Body — hidden when minimized */}
        {!minimized && (
          <>
            <div
              style={{
                ...fieldStyle,
                alignItems: "flex-start",
                flexWrap: "wrap",
                minHeight: 38,
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  color: "#5f6368",
                  minWidth: 28,
                  paddingTop: 4,
                }}
              >
                To
              </span>
              <ToField
                recipients={recipients}
                onChange={setRecipients}
                preloaded={preloadedContacts}
              />
              <div style={{ display: "flex", gap: 4, paddingTop: 4, flexShrink: 0 }}>
                {!showCc && (
                  <button onClick={() => setShowCc(true)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#5f6368", padding: "0 4px", fontFamily: "inherit" }}
                    onMouseEnter={e => e.currentTarget.style.color = "#1a73e8"}
                    onMouseLeave={e => e.currentTarget.style.color = "#5f6368"}>Cc</button>
                )}
                {!showBcc && (
                  <button onClick={() => setShowBcc(true)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#5f6368", padding: "0 4px", fontFamily: "inherit" }}
                    onMouseEnter={e => e.currentTarget.style.color = "#1a73e8"}
                    onMouseLeave={e => e.currentTarget.style.color = "#5f6368"}>Bcc</button>
                )}
              </div>
            </div>
            {showCc && (
              <div style={{ ...fieldStyle, alignItems: "flex-start", flexWrap: "wrap", minHeight: 38 }}>
                <span style={{ fontSize: 13, color: "#5f6368", minWidth: 28, paddingTop: 4 }}>Cc</span>
                <ToField recipients={cc} onChange={setCc} preloaded={preloadedContacts} />
                <button onClick={() => { setShowCc(false); setCc([]); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#5f6368", padding: "4px 4px 0", flexShrink: 0, display: "flex" }}><MdClose size={16} /></button>
              </div>
            )}
            {showBcc && (
              <div style={{ ...fieldStyle, alignItems: "flex-start", flexWrap: "wrap", minHeight: 38 }}>
                <span style={{ fontSize: 13, color: "#5f6368", minWidth: 28, paddingTop: 4 }}>Bcc</span>
                <ToField recipients={bcc} onChange={setBcc} preloaded={preloadedContacts} />
                <button onClick={() => { setShowBcc(false); setBcc([]); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#5f6368", padding: "4px 4px 0", flexShrink: 0, display: "flex" }}><MdClose size={16} /></button>
              </div>
            )}
            <div style={fieldStyle}>
              <span style={{ fontSize: 13, color: "#5f6368", minWidth: 28 }}>
                Subject
              </span>
              <input
                style={inputStyle}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <RichTextEditor
                ref={editorRef} 
                onChange={(html) => {
                  setBody(html);
                }}
                fullscreen={fullscreen}
                showToolbar={showFormatting}
                initialHTML={body || ''}
            />
            
            {/* Attachment chips */}
            {attachments.length > 0 && (
              <div style={{
                display: "flex", flexWrap: "wrap", gap: 8,
                padding: "8px 16px 4px",
                borderTop: "1px solid #e0e0e0",
              }}>
                {attachments.map((file, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 6,
                    background: "#f1f3f4", borderRadius: 8,
                    padding: "6px 10px", maxWidth: 220,
                  }}>
                    <MdAttachFile size={16} style={{ color: "#5f6368", flexShrink: 0 }} />
                    <span style={{
                      fontSize: 12, color: "#202124",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {file.name}
                    </span>
                    <span style={{ fontSize: 11, color: "#5f6368", flexShrink: 0 }}>
                      {file.size < 1024 * 1024
                        ? `${(file.size / 1024).toFixed(0)} KB`
                        : `${(file.size / 1024 / 1024).toFixed(1)} MB`}
                    </span>
                    <button
                      onClick={() => setAttachments(a => a.filter((_, j) => j !== i))}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#5f6368", display: "flex", alignItems: "center", flexShrink: 0 }}
                    >
                      <MdClose size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              style={{ display: "none" }}
              onChange={e => {
                const newFiles = Array.from(e.target.files || []);
                setAttachments(prev => {
                  const existing = new Set(prev.map(f => f.name + f.size));
                  return [...prev, ...newFiles.filter(f => !existing.has(f.name + f.size))];
                });
                e.target.value = "";
              }}
            />

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 16px",
                borderTop: "0.5px solid #e0e0e0",
                flexShrink: 0,
              }}
            >
              <button
                onClick={handleSend}
                disabled={sending}
                style={{
                  background: "#1a73e8",
                  color: "#fff",
                  border: "none",
                  borderRadius: 20,
                  padding: "8px 24px",
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: sending ? "default" : "pointer",
                  opacity: sending ? 0.7 : 1,
                }}
              >
                {sending ? "Sending..." : "Send"}
              </button>

              {/* Aa — Formatting Options (always visible, next to Send) */}
              <Tooltip label={showFormatting ? "Hide formatting" : "Formatting options"} position="top">
                <button
                  onClick={() => setShowFormatting(v => !v)}
                  style={{
                    background: showFormatting ? "#e8f0fe" : "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "5px 8px",
                    borderRadius: 4,
                    color: showFormatting ? "#1967d2" : "#5f6368",
                    display: "flex",
                    alignItems: "center",
                    lineHeight: 1,
                    gap: 1,
                  }}
                  onMouseEnter={e => { if (!showFormatting) e.currentTarget.style.background = "#f1f3f4"; }}
                  onMouseLeave={e => { if (!showFormatting) e.currentTarget.style.background = "none"; }}
                >
                  <span style={{ fontSize: 15, fontWeight: 700 }}>A</span>
                  <span style={{ fontSize: 11, fontWeight: 600 }}>a</span>
                </button>
              </Tooltip>

              <Tooltip label="Attach files" position="top">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    padding: "6px 8px", borderRadius: "50%",
                    color: attachments.length > 0 ? "#1a73e8" : "#5f6368",
                    display: "flex", alignItems: "center", position: "relative",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f1f3f4"}
                  onMouseLeave={e => e.currentTarget.style.background = "none"}
                >
                  <MdAttachFile size={18} />
                  {attachments.length > 0 && (
                    <span style={{
                      position: "absolute", top: 2, right: 2,
                      background: "#1a73e8", color: "#fff",
                      borderRadius: "50%", width: 14, height: 14,
                      fontSize: 9, fontWeight: 700,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {attachments.length}
                    </span>
                  )}
                </button>
              </Tooltip>

              {/* Insert Link */}
              <Tooltip label="Insert link" position="top">
                <button
                  onClick={() => editorRef.current?.openLinkDialog()}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: "6px 8px", borderRadius: "50%", color: "#5f6368", display: "flex", alignItems: "center" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f1f3f4"}
                  onMouseLeave={e => e.currentTarget.style.background = "none"}
                >
                  <MdInsertLink size={18} />
                </button>
              </Tooltip>

              {/* Insert Emoji */}
              <Tooltip label="Insert emoji" position="top">
                <button
                  onClick={() => editorRef.current?.openEmojiPicker()}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: "6px 8px", borderRadius: "50%", color: "#5f6368", display: "flex", alignItems: "center", fontSize: 16 }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f1f3f4"}
                  onMouseLeave={e => e.currentTarget.style.background = "none"}
                >😊</button>
              </Tooltip>

              {/* Insert Image */}
              <Tooltip label="Insert image" position="top">
                <button
                  onClick={() => editorRef.current?.triggerImageInsert()}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: "6px 8px", borderRadius: "50%", color: "#5f6368", display: "flex", alignItems: "center" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f1f3f4"}
                  onMouseLeave={e => e.currentTarget.style.background = "none"}
                >
                  <MdImage size={18} />
                </button>
              </Tooltip>

              {/* Insert Signature */}
              <div style={{ position: "relative" }} ref={signaturePopoverRef}>
                <Tooltip label="Insert signature" position="top">
                <button
                  onClick={() => {
                    setEditingSignature(false);
                    setShowSignaturePopover(v => !v);
                  }}
                  style={{ background: showSignaturePopover ? "#e8f0fe" : "none", border: "none", cursor: "pointer", padding: "6px 8px", borderRadius: "50%", color: showSignaturePopover ? "#1967d2" : "#5f6368", display: "flex", alignItems: "center" }}
                  onMouseEnter={e => { if (!showSignaturePopover) e.currentTarget.style.background = "#f1f3f4"; }}
                  onMouseLeave={e => { if (!showSignaturePopover) e.currentTarget.style.background = "none"; }}
                >
                  <MdDraw size={18} />
                </button>
                </Tooltip>
                {showSignaturePopover && (
                  <div style={{
                    position: "absolute", bottom: "calc(100% + 8px)", right: 0,
                    zIndex: 500, background: "#fff", borderRadius: 8,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.18)", border: "1px solid #e0e0e0",
                    width: 300, padding: "14px 16px",
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#202124", marginBottom: 10 }}>Signature</div>
                    {editingSignature ? (
                      <>
                        {/* Mini toolbar for signature editor */}
                        <div style={{ display: "flex", alignItems: "center", gap: 2, marginBottom: 4, padding: "2px 0" }}>
                          {[
                            { cmd: "bold",      label: <b>B</b>          },
                            { cmd: "italic",    label: <i>I</i>          },
                            { cmd: "underline", label: <u>U</u>          },
                          ].map(({ cmd, label }) => (
                            <button key={cmd} onMouseDown={e => { e.preventDefault(); signatureEditorRef.current?.focus(); document.execCommand(cmd); }}
                              style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 6px", borderRadius: 3, fontSize: 13, color: "#444746" }}
                              onMouseEnter={e => e.currentTarget.style.background = "#f1f3f4"}
                              onMouseLeave={e => e.currentTarget.style.background = "none"}>{label}</button>
                          ))}
                          <div style={{ width: 1, height: 14, background: "#e0e0e0", margin: "0 2px" }} />
                          {/* Image upload */}
                          <input ref={signatureImageInputRef} type="file" accept="image/*" style={{ display: "none" }}
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = ev => {
                                const el = signatureEditorRef.current;
                                if (!el) return;
                                el.innerHTML += `<img src="${ev.target.result}" alt="signature" style="max-width:100%;height:auto;vertical-align:middle;" />`;
                                el.focus();
                              };
                              reader.readAsDataURL(file);
                              e.target.value = "";
                            }}
                          />
                          <button onMouseDown={e => { e.preventDefault(); signatureImageInputRef.current?.click(); }}
                            style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 6px", borderRadius: 3, fontSize: 12, color: "#444746", display: "flex", alignItems: "center" }}
                            onMouseEnter={e => e.currentTarget.style.background = "#f1f3f4"}
                            onMouseLeave={e => e.currentTarget.style.background = "none"} title="Insert image">
                            <MdImage size={15} />
                          </button>
                        </div>

                        {/* Rich editor */}
                        <div
                          ref={signatureEditorRef}
                          contentEditable
                          suppressContentEditableWarning
                          onInput={() => {}}
                          data-placeholder="Type your signature or insert an image..."
                          style={{
                            minHeight: 80, maxHeight: 160, overflowY: "auto",
                            border: "1px solid #dadce0", borderRadius: 4,
                            padding: "8px 10px", fontSize: 13, fontFamily: "inherit",
                            outline: "none", lineHeight: 1.5, marginBottom: 10,
                          }}
                          onFocus={e => e.currentTarget.style.borderColor = "#1a73e8"}
                          onBlur={e => e.currentTarget.style.borderColor = "#dadce0"}
                        />

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                          <button onClick={() => setEditingSignature(false)}
                            style={{ padding: "6px 14px", borderRadius: 4, border: "1px solid #dadce0", background: "#fff", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
                            onMouseEnter={e => e.currentTarget.style.background = "#f1f3f4"}
                            onMouseLeave={e => e.currentTarget.style.background = "#fff"}>Cancel</button>
                          <button onClick={() => {
                              const html = signatureEditorRef.current?.innerHTML || "";
                              setSignatureHtml(html);
                              setEditingSignature(false);
                              fetch(`${API_URL}/signature`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ id: signatureId || undefined, html, is_default: 1 }),
                              })
                                .then(r => r.json())
                                .then(data => { if (data.id) setSignatureId(data.id); })
                                .catch(() => {});
                            }}
                            style={{ padding: "6px 14px", borderRadius: 4, border: "none", background: "#1a73e8", color: "#fff", fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}
                            onMouseEnter={e => e.currentTarget.style.background = "#1765cc"}
                            onMouseLeave={e => e.currentTarget.style.background = "#1a73e8"}>Save</button>
                        </div>
                      </>
                    ) : (
                      <>
                        {signatureHtml ? (
                          <div
                            dangerouslySetInnerHTML={{ __html: signatureHtml }}
                            style={{ fontSize: 13, color: "#202124", background: "#f8f9fa", borderRadius: 4, padding: "8px 10px", marginBottom: 10, maxHeight: 120, overflowY: "auto", wordBreak: "break-word" }}
                          />
                        ) : (
                          <div style={{ fontSize: 13, color: "#5f6368", marginBottom: 10 }}>No signature set.</div>
                        )}
                        <div style={{ display: "flex", gap: 8 }}>
                          {signatureHtml && (
                            <button
                              onClick={() => {
                                const html = `<br/><div style="padding-top:8px;margin-top:8px;font-size:13px">${signatureHtml}</div>`;
                                const mainEditor = editorRef.current;
                                if (mainEditor) {
                                  // Use the exposed insertHTML via RichTextEditor's exec
                                  const el = document.querySelector('[data-placeholder="Write your message..."]');
                                  if (el) {
                                    el.focus();
                                    const sel = window.getSelection();
                                    const range = document.createRange();
                                    range.selectNodeContents(el);
                                    range.collapse(false);
                                    sel.removeAllRanges();
                                    sel.addRange(range);
                                    document.execCommand("insertHTML", false, html);
                                    setBody(el.innerHTML);
                                  }
                                }
                                setShowSignaturePopover(false);
                              }}
                              style={{ flex: 1, padding: "6px 14px", borderRadius: 4, border: "none", background: "#1a73e8", color: "#fff", fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}
                              onMouseEnter={e => e.currentTarget.style.background = "#1765cc"}
                              onMouseLeave={e => e.currentTarget.style.background = "#1a73e8"}>Insert</button>
                          )}
                          <button onClick={() => {
                              setEditingSignature(true);
                              // Pre-fill editor with saved HTML after it mounts
                              setTimeout(() => {
                                if (signatureEditorRef.current) signatureEditorRef.current.innerHTML = signatureHtml;
                              }, 0);
                            }}
                            style={{ flex: 1, padding: "6px 14px", borderRadius: 4, border: "1px solid #dadce0", background: "#fff", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
                            onMouseEnter={e => e.currentTarget.style.background = "#f1f3f4"}
                            onMouseLeave={e => e.currentTarget.style.background = "#fff"}>{signatureHtml ? "Edit" : "Create"}</button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              <Tooltip label="More options" position="top">
                <button
                  style={{ background: "none", border: "none", cursor: "pointer", padding: "6px 8px", borderRadius: "50%", color: "#5f6368", display: "flex", alignItems: "center" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f1f3f4"}
                  onMouseLeave={e => e.currentTarget.style.background = "none"}
                >
                  <MdMoreVert size={18} />
                </button>
              </Tooltip>
              <div style={{ flex: 1 }} />
              <Tooltip label="Discard draft" position="top">
                <button
                  onClick={handleClose}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "6px 8px",
                    borderRadius: "50%",
                    color: "#5f6368",
                    display: "flex",
                    alignItems: "center",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f1f3f4"}
                  onMouseLeave={e => e.currentTarget.style.background = "none"}
                >
                  <MdDelete size={18} />
                </button>
              </Tooltip>
            </div>
          </>
        )}
      </div>
    </>
  );
}

// ── PDF thumbnail — renders first page inline inside the attachment card ──────
function PdfThumbnail({ url }) {
  const [pageReady, setPageReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const fileObj = useMemo(() => ({ url, withCredentials: true }), [url]);

  return (
    <div style={{ width: "100%", height: "100%", overflow: "hidden", position: "relative", pointerEvents: "none" }}>
      {!loadError && (
        <div style={{
          position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
          opacity: pageReady ? 1 : 0, transition: "opacity 0.25s",
        }}>
          <Document
            file={fileObj}
            onLoadError={() => setLoadError(true)}
            loading={null}
            error={null}
          >
            <Page
              pageNumber={1}
              width={220}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              onRenderSuccess={() => setPageReady(true)}
            />
          </Document>
        </div>
      )}
      {/* Show icon while loading or on error */}
      {(!pageReady || loadError) && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <MdPictureAsPdf size={36} color="#EA4335" />
        </div>
      )}
    </div>
  );
}

// ── Attachment preview helpers ────────────────────────────────────────────────
function PdfViewer({ blobUrl }) {
  const [numPages, setNumPages] = useState(null);
  const [scale, setScale] = useState(1.2);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 120px)", width: "90vw", maxWidth: 900 }}>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 14px", background: "rgba(255,255,255,0.08)", borderRadius: "6px 6px 0 0", flexShrink: 0 }}>
        <span style={{ color: "#ccc", fontSize: 13, flex: 1 }}>
          {numPages ? `${numPages} page${numPages > 1 ? "s" : ""}` : ""}
        </span>
        <button onClick={() => setScale(s => Math.max(0.5, +(s - 0.2).toFixed(1)))}
          title="Zoom out"
          style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", cursor: "pointer", width: 30, height: 30, borderRadius: 4, fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
        <span style={{ color: "#fff", fontSize: 13, minWidth: 46, textAlign: "center" }}>{Math.round(scale * 100)}%</span>
        <button onClick={() => setScale(s => Math.min(3, +(s + 0.2).toFixed(1)))}
          title="Zoom in"
          style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", cursor: "pointer", width: 30, height: 30, borderRadius: 4, fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
        <button onClick={() => setScale(1.2)} title="Reset zoom"
          style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#ccc", cursor: "pointer", padding: "4px 10px", borderRadius: 4, fontSize: 12 }}>Reset</button>
      </div>

      {/* Scrollable pages */}
      <div style={{ flex: 1, overflowY: "auto", background: "#525659", display: "flex", flexDirection: "column", alignItems: "center", padding: "16px 0", gap: 12 }}>
        <Document
          file={blobUrl}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          loading={<div style={{ color: "#ccc", padding: 40, fontSize: 14 }}>Loading PDF…</div>}
          error={<div style={{ color: "#ccc", padding: 40, fontSize: 14 }}>Failed to load PDF.</div>}
        >
          {numPages && Array.from({ length: numPages }, (_, i) => (
            <div key={i} style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.5)", marginBottom: 4 }}>
              <Page
                pageNumber={i + 1}
                scale={scale}
                renderTextLayer
                renderAnnotationLayer
              />
            </div>
          ))}
        </Document>
      </div>
    </div>
  );
}

function TextPreview({ blobUrl }) {
  const [text, setText] = useState("");
  useEffect(() => {
    fetch(blobUrl).then(r => r.text()).then(setText).catch(() => {});
  }, [blobUrl]);
  return (
    <pre style={{
      background: "#fff", color: "#202124", padding: 24, borderRadius: 4,
      maxWidth: "90vw", maxHeight: "calc(100vh - 120px)", overflowY: "auto",
      fontSize: 13, fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-word",
      margin: 0,
    }}>
      {text || " "}
    </pre>
  );
}

function AttachmentPreviewModal({ initialAtt, msgId, folderParam, allAtts, onClose, onDownload }) {
  const [currentIdx, setCurrentIdx] = useState(() => allAtts.findIndex(a => a.index === initialAtt.index));
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const blobUrlRef = useRef(null);

  const currentAtt = allAtts[currentIdx];

  useEffect(() => {
    if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = null; }
    setBlobUrl(null);
    setLoading(true);
    setFetchError(false);
    let cancelled = false;
    const sep = folderParam ? "&" : "?";
    fetch(`${API_URL}/emails/${msgId}/attachments/${currentAtt.index}${folderParam}${sep}preview=1`)
      .then(r => { if (!r.ok) throw new Error(); return r.blob(); })
      .then(blob => {
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        blobUrlRef.current = url;
        setBlobUrl(url);
        setLoading(false);
      })
      .catch(() => { if (!cancelled) { setFetchError(true); setLoading(false); } });
    return () => { cancelled = true; };
  }, [currentIdx]);

  useEffect(() => {
    return () => { if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current); };
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && currentIdx > 0) setCurrentIdx(i => i - 1);
      if (e.key === "ArrowRight" && currentIdx < allAtts.length - 1) setCurrentIdx(i => i + 1);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [currentIdx, allAtts.length, onClose]);

  const isImage = currentAtt.contentType.startsWith("image/");
  const isPdf   = currentAtt.contentType === "application/pdf";
  const isText  = currentAtt.contentType.startsWith("text/");
  const isVideo = currentAtt.contentType.startsWith("video/");
  const isAudio = currentAtt.contentType.startsWith("audio/");
  const canPreview = isImage || isPdf || isText || isVideo || isAudio;

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 3000 }} />
      <div style={{ position: "fixed", inset: 0, zIndex: 3001, display: "flex", flexDirection: "column", pointerEvents: "none" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "rgba(0,0,0,0.6)", flexShrink: 0, pointerEvents: "all" }}>
          <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {currentAtt.filename}
          </span>
          {allAtts.length > 1 && (
            <span style={{ fontSize: 13, color: "#bbb", flexShrink: 0 }}>{currentIdx + 1} / {allAtts.length}</span>
          )}
          <button onClick={() => onDownload(currentAtt.index, currentAtt.filename)} title="Download"
            style={{ background: "none", border: "none", cursor: "pointer", color: "#fff", display: "flex", padding: 6, borderRadius: "50%" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}
            onMouseLeave={e => e.currentTarget.style.background = "none"}>
            <MdDownload size={20} />
          </button>
          <button onClick={onClose} title="Close"
            style={{ background: "none", border: "none", cursor: "pointer", color: "#fff", display: "flex", padding: 6, borderRadius: "50%" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}
            onMouseLeave={e => e.currentTarget.style.background = "none"}>
            <MdClose size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative", pointerEvents: "all" }}>
          {/* Prev */}
          {allAtts.length > 1 && currentIdx > 0 && (
            <button onClick={() => setCurrentIdx(i => i - 1)}
              style={{ position: "absolute", left: 16, zIndex: 1, background: "rgba(0,0,0,0.5)", border: "none", color: "#fff", borderRadius: "50%", width: 40, height: 40, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,0.8)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(0,0,0,0.5)"}>
              <MdKeyboardArrowLeft size={26} />
            </button>
          )}

          {loading && <div style={{ color: "#ccc", fontSize: 14 }}>Loading preview…</div>}

          {!loading && (fetchError || !canPreview) && (
            <div style={{ color: "#ccc", textAlign: "center" }}>
              <MdInsertDriveFile size={56} style={{ marginBottom: 12, opacity: 0.6 }} />
              <div style={{ fontSize: 14, marginBottom: 20 }}>No preview available</div>
              <button onClick={() => onDownload(currentAtt.index, currentAtt.filename)}
                style={{ padding: "8px 24px", background: "#1a73e8", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 14 }}>
                Download
              </button>
            </div>
          )}

          {!loading && !fetchError && blobUrl && canPreview && (
            <>
              {isImage && <img src={blobUrl} alt={currentAtt.filename} style={{ maxWidth: "90vw", maxHeight: "calc(100vh - 120px)", objectFit: "contain", borderRadius: 4 }} />}
              {isPdf   && <PdfViewer blobUrl={blobUrl} />}
              {isVideo && <video src={blobUrl} controls style={{ maxWidth: "90vw", maxHeight: "calc(100vh - 120px)", outline: "none", borderRadius: 4 }} />}
              {isAudio && <audio src={blobUrl} controls style={{ width: 420, maxWidth: "90vw" }} />}
              {isText  && <TextPreview blobUrl={blobUrl} />}
            </>
          )}

          {/* Next */}
          {allAtts.length > 1 && currentIdx < allAtts.length - 1 && (
            <button onClick={() => setCurrentIdx(i => i + 1)}
              style={{ position: "absolute", right: 16, zIndex: 1, background: "rgba(0,0,0,0.5)", border: "none", color: "#fff", borderRadius: "50%", width: 40, height: 40, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,0.8)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(0,0,0,0.5)"}>
              <MdKeyboardArrowRight size={26} />
            </button>
          )}
        </div>
      </div>
    </>
  );
}

// ── Single message card inside a thread ──────────────────────────────────────
function ThreadMessageCard({ msgMeta, initialExpanded, onReplyClick, onForwardClick }) {
  const folderParam = msgMeta.folder === "sent" ? "?folder=sent" : msgMeta.folder === "trash" ? "?folder=trash" : msgMeta.folder === "spam" ? "?folder=spam" : "";
  const [expanded, setExpanded] = useState(initialExpanded);
  const [showDetails, setShowDetails] = useState(false);
  const [downloadingIdx, setDownloadingIdx] = useState(null);
  const [previewAtt, setPreviewAtt] = useState(null);
  const [hoveredThumb, setHoveredThumb] = useState(null);
  const [senderVerified, setSenderVerified] = useState(false);

  const { data: detail, isLoading } = useQuery({
    queryKey: ["email", msgMeta.id, msgMeta.folder],
    queryFn: () => fetch(`${API_URL}/emails/${msgMeta.id}${folderParam}`).then(r => r.json()),
    enabled: expanded,
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
  });

  const senderName = detail?.senderName || msgMeta.senderName;
  const senderEmail = detail?.senderEmail || msgMeta.senderEmail || "";
  const toEmail = detail?.toEmail || "";
  const ccList = detail?.cc || [];
  const bccList = detail?.bcc || [];
  const fullDate = detail?.date
    ? new Date(detail.date).toLocaleString([], { weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : msgMeta.time;

  const downloadAttachment = async (index, filename) => {
    setDownloadingIdx(index);
    try {
      const res = await fetch(`${API_URL}/emails/${msgMeta.id}/attachments/${index}${folderParam}`);
      if (!res.ok) throw new Error("Failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch (err) { console.error("Download failed:", err); }
    finally { setDownloadingIdx(null); }
  };

  if (!expanded) {
    // Collapsed row
    const snippet = msgMeta.subject || "";
    return (
      <div
        onClick={() => setExpanded(true)}
        style={{
          border: "0.5px solid #e0e0e0",
          borderRadius: 8,
          padding: "12px 20px",
          marginBottom: 8,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 14,
          background: "#fff",
          transition: "background 0.1s",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "#f6f8fc"}
        onMouseLeave={e => e.currentTarget.style.background = "#fff"}
      >
        <SenderAvatar
          senderEmail={senderEmail}
          initials={msgMeta.avatar || (senderName||"?").charAt(0).toUpperCase()}
          color={msgMeta.folder === "sent" ? "#34a853" : "#1a73e8"}
          size={32}
          onVerified={setSenderVerified}
        />
        <span style={{ fontWeight: 600, fontSize: 13, color: "#202124", flexShrink: 0 }}>
          {senderName}
        </span>
        <span style={{ fontSize: 13, color: "#5f6368", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {snippet}
        </span>
        <span style={{ fontSize: 12, color: "#5f6368", flexShrink: 0 }}>{msgMeta.time}</span>
      </div>
    );
  }

  // Expanded card
  return (
    <div
      style={{
        border: "0.5px solid #e0e0e0",
        borderRadius: 8,
        padding: "20px 24px",
        marginBottom: 8,
        background: "#fff",
      }}
    >
      {/* Sender row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 20 }}>
        <SenderAvatar
          key={senderEmail}
          senderEmail={senderEmail}
          initials={msgMeta.avatar || (senderName||"?").charAt(0).toUpperCase()}
          color={msgMeta.folder === "sent" ? "#34a853" : "#1a73e8"}
          size={40}
          onVerified={setSenderVerified}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, flexWrap: "wrap" }}>
              <span style={{ fontWeight: 600, fontSize: 14, color: "#202124" }}>{senderName}</span>
              {senderVerified && (
                <VerificationBadge domain={senderEmail.split("@")[1]} />
              )}
              {senderEmail && <span style={{ fontSize: 12, color: "#5f6368" }}>&lt;{senderEmail}&gt;</span>}
            </div>
            <span style={{ fontSize: 12, color: "#5f6368", flexShrink: 0 }}>{fullDate}</span>
          </div>
          
          {/* Details dropdown trigger */}
          <div
            style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3, cursor: "pointer" }}
            onClick={() => setShowDetails(v => !v)}
          >
            <span style={{ fontSize: 12, color: "#5f6368" }}>
              to {toEmail || "me"}
              {(ccList.length > 0 || bccList.length > 0) && (
                <span style={{ marginLeft: 4, color: "#1a73e8" }}>
                  {ccList.length > 0 && ` +${ccList.length} cc`}
                  {bccList.length > 0 && ` +${bccList.length} bcc`}
                </span>
              )}
            </span>
            <MdKeyboardArrowDown size={16} color="#5f6368"
              style={{ transform: showDetails ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
            />
          </div>
          
          {/* Expanded details with CC and BCC */}
          {showDetails && (
            <div style={{ marginTop: 8, fontSize: 12, color: "#5f6368", lineHeight: 1.8 }}>
              <div><span style={{ display: "inline-block", minWidth: 40 }}>from:</span> {senderName} &lt;{senderEmail}&gt;</div>
              <div><span style={{ display: "inline-block", minWidth: 40 }}>to:</span> {toEmail || "me"}</div>
              {ccList.length > 0 && (
                <div><span style={{ display: "inline-block", minWidth: 40 }}>cc:</span> {ccList.map(c => `${c.name || c.email} <${c.email}>`).join(", ")}</div>
              )}
              {bccList.length > 0 && (
                <div><span style={{ display: "inline-block", minWidth: 40 }}>bcc:</span> {bccList.map(b => `${b.name || b.email} <${b.email}>`).join(", ")}</div>
              )}
              <div><span style={{ display: "inline-block", minWidth: 40 }}>date:</span> {fullDate}</div>
              <div><span style={{ display: "inline-block", minWidth: 40 }}>subject:</span> {msgMeta.subject}</div>
            </div>
          )}
        </div>
        
        {/* Reply/Forward icon buttons */}
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          <button onClick={() => onReplyClick(senderEmail, senderName)} title="Reply"
            style={{ background: "none", border: "none", cursor: "pointer", color: "#5f6368", borderRadius: "50%", padding: 6, display: "flex" }}
            onMouseEnter={e => e.currentTarget.style.background = "#f1f3f4"}
            onMouseLeave={e => e.currentTarget.style.background = "none"}
          ><MdReply size={18} /></button>
          <button onClick={() => {
              const origBody = detail?.html
                ? detail.html
                : `<pre style="font-size:13px;white-space:pre-wrap">${(detail?.text||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</pre>`;
              const header = `<div style="color:#5f6368;font-size:13px;border-left:none;padding:0;margin-bottom:8px">---------- Forwarded message ---------<br>From: <b>${senderName}</b> &lt;${senderEmail}&gt;<br>Date: ${fullDate}<br>Subject: ${msgMeta.subject || ""}<br>To: ${toEmail || ""}</div>`;
              onForwardClick(`<br><br>${header}${origBody}`);
            }} title="Forward"
            style={{ background: "none", border: "none", cursor: "pointer", color: "#5f6368", borderRadius: "50%", padding: 6, display: "flex" }}
            onMouseEnter={e => e.currentTarget.style.background = "#f1f3f4"}
            onMouseLeave={e => e.currentTarget.style.background = "none"}
          ><MdForward size={18} /></button>
          <button onClick={() => setExpanded(false)} title="Collapse"
            style={{ background: "none", border: "none", cursor: "pointer", color: "#5f6368", borderRadius: "50%", padding: 6, display: "flex" }}
            onMouseEnter={e => e.currentTarget.style.background = "#f1f3f4"}
            onMouseLeave={e => e.currentTarget.style.background = "none"}
          ><MdKeyboardArrowUp size={18} /></button>
        </div>
      </div>

      {/* Body */}
      {isLoading ? (
        <div style={{ color: "#5f6368", fontSize: 13, padding: "20px 0" }}>Loading message...</div>
      ) : detail?.html ? (
        <div style={{ fontSize: 14, color: "#202124", lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: detail.html }} />
      ) : (
        <div style={{ fontSize: 14, color: "#202124", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
          {detail?.text || "(No message content)"}
        </div>
      )}

      {/* Attachments */}
      {!isLoading && detail?.attachments?.length > 0 && (
        <div style={{ marginTop: 24, borderTop: "0.5px solid #e0e0e0", paddingTop: 16 }}>
          <div style={{ fontSize: 13, color: "#5f6368", marginBottom: 10 }}>
            {detail.attachments.length} attachment{detail.attachments.length > 1 ? "s" : ""}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {detail.attachments.map(att => {
              const isImage = att.contentType.startsWith("image/");
              const isPdf = att.contentType === "application/pdf";
              const AttIcon = isImage ? MdImage : isPdf ? MdPictureAsPdf : MdInsertDriveFile;
              const iconColor = isImage ? "#34A853" : isPdf ? "#EA4335" : "#1a73e8";
              const sizeLabel = att.size >= 1024*1024 ? `${(att.size/1024/1024).toFixed(1)} MB` : att.size >= 1024 ? `${(att.size/1024).toFixed(0)} KB` : `${att.size} B`;
              return (
                <div key={att.index} style={{ border: "0.5px solid #e0e0e0", borderRadius: 8, width: 220, overflow: "hidden", background: "#f8f9fa" }}>
                  {/* Thumbnail — click to preview */}
                  <div
                    style={{ height: 80, background: "#f1f3f4", display: "flex", alignItems: "center", justifyContent: "center", borderBottom: "0.5px solid #e0e0e0", cursor: "pointer", position: "relative", overflow: "hidden" }}
                    onClick={() => setPreviewAtt(att)}
                    onMouseEnter={() => setHoveredThumb(att.index)}
                    onMouseLeave={() => setHoveredThumb(null)}
                    title="Preview"
                  >
                    {isImage ? (
                      <img
                        src={`${API_URL}/emails/${msgMeta.id}/attachments/${att.index}${folderParam}`}
                        alt={att.filename}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={e => { e.target.style.display = "none"; }}
                      />
                    ) : isPdf ? (
                      <PdfThumbnail
                        url={`${API_URL}/emails/${msgMeta.id}/attachments/${att.index}${folderParam ? folderParam + "&" : "?"}preview=1`}
                      />
                    ) : (
                      <AttIcon size={36} color={iconColor} />
                    )}
                    {hoveredThumb === att.index && (
                      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <MdVisibility size={26} color="#fff" />
                      </div>
                    )}
                  </div>
                  <div style={{ padding: "8px 10px", display: "flex", alignItems: "center", gap: 8 }}>
                    <AttIcon size={16} color={iconColor} style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: "#202124", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{att.filename}</div>
                      <div style={{ fontSize: 11, color: "#5f6368" }}>{sizeLabel}</div>
                    </div>
                    <button onClick={e => { e.stopPropagation(); downloadAttachment(att.index, att.filename); }}
                      title="Download" disabled={downloadingIdx === att.index}
                      style={{ background: "none", border: "none", cursor: downloadingIdx === att.index ? "default" : "pointer", color: "#5f6368", display: "flex", flexShrink: 0, padding: 0, opacity: downloadingIdx === att.index ? 0.4 : 1 }}>
                      <MdDownload size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Attachment preview modal */}
      {previewAtt && (
        <AttachmentPreviewModal
          initialAtt={previewAtt}
          msgId={msgMeta.id}
          folderParam={folderParam}
          allAtts={detail.attachments}
          onClose={() => setPreviewAtt(null)}
          onDownload={downloadAttachment}
        />
      )}
    </div>
  );
}

// ContentEditable editor that sets initialHtml once on mount.
// Using a separate component + key lets us remount cleanly when compose reopens.
function BodyEditor({ initialHtml, editorRef, onKeyDown }) {
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = initialHtml || "";
      // Place cursor at the start so the user types above forwarded content
      try {
        const range = document.createRange();
        const sel = window.getSelection();
        range.setStart(editorRef.current, 0);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      } catch (_) {}
      editorRef.current.focus();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={editorRef}
      contentEditable
      suppressContentEditableWarning
      onKeyDown={onKeyDown}
      style={{
        minHeight: 120,
        padding: "12px 16px",
        fontSize: 14,
        color: "#202124",
        outline: "none",
        lineHeight: 1.6,
      }}
    />
  );
}

function EmailDetail({
  email,
  onClose,
  onReply,
  onForward,
  onDelete,
  onToast,
  onRestoreEmail,
  onUpdateEmail,
  onMarkUnread,
  onPrev,
  onNext,
  emailPosition,
  totalEmails,
  folder,
}) {
  const folderParam = folder === "sent" ? "?folder=sent" : folder === "drafts" ? "?folder=drafts" : folder === "trash" ? "?folder=trash" : folder === "spam" ? "?folder=spam" : "";
  const queryClient = useQueryClient();
  const [detailLoading, setDetailLoading] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [mailboxes, setMailboxes] = useState([]);
  // acting state removed — actions are now optimistic (fire-and-forget)
  const [inlineMode, setInlineMode] = useState(null); // null | 'reply' | 'forward'
  const [inlineRecipients, setInlineRecipients] = useState([]);
  const [inlineCc, setInlineCc]   = useState([]);
  const [inlineBcc, setInlineBcc] = useState([]);
  const [showInlineCc, setShowInlineCc]   = useState(false);
  const [showInlineBcc, setShowInlineBcc] = useState(false);
  const [inlineSubject, setInlineSubject] = useState("");
  const [inlineInitialBody, setInlineInitialBody] = useState("");
  const [inlineBodyHtml, setInlineBodyHtml] = useState("");
  const [inlineKey, setInlineKey] = useState(0); // bumped on each open to remount RichTextEditor
  const [showInlineFormatting, setShowInlineFormatting] = useState(false);
  const [inlineContacts, setInlineContacts] = useState([]);
  const inlineEditorRef = useRef(null);
  const inlineBodyRef = useRef(null);
  const lastForwardBodyRef = useRef(""); // updated whenever a card's Forward is clicked
  const inlineSignaturePopoverRef = useRef(null);
  const inlineSignatureEditorRef = useRef(null);
  const inlineSignatureImageInputRef = useRef(null);
  const [showInlineSignaturePopover, setShowInlineSignaturePopover] = useState(false);
  const [inlineSignatureHtml, setInlineSignatureHtml] = useState("");
  const [inlineSignatureId, setInlineSignatureId] = useState(null);
  const [editingInlineSignature, setEditingInlineSignature] = useState(false);

  // Load default signature from backend
  useEffect(() => {
    fetch(`${API_URL}/signature`)
      .then(r => r.json())
      .then(data => {
        if (data.html) {
          setInlineSignatureHtml(data.html);
          setInlineSignatureId(data.id || null);
        }
      })
      .catch(() => {});
  }, []);

  // Close inline signature popover on outside click
  useEffect(() => {
    const handler = (e) => {
      if (inlineSignaturePopoverRef.current && !inlineSignaturePopoverRef.current.contains(e.target))  {
        setShowInlineSignaturePopover(false);
        setEditingInlineSignature(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.isContentEditable)
        return;
      if (inlineMode) return;
      if (e.key === "ArrowLeft" && onPrev) onPrev();
      if (e.key === "ArrowRight" && onNext) onNext();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onPrev, onNext, inlineMode]);

  const act = (endpoint, method = "POST") => {
    fetch(`${API_URL}/emails/${email.id}/${endpoint}${folderParam}`, { method }).catch(e => console.error(e));
  };

  const handleArchive = () => {
    const savedEmail = email;
    act("archive");
    onToast?.("Conversation archived.", {
      label: "Undo",
      onClick: () => {
        onRestoreEmail?.(savedEmail);
        fetch(`${API_URL}/emails/${savedEmail.id}/restore`, { method: "POST" }).catch(() => {});
        onToast?.("Action undone.");
      },
    });
    onDelete();
  };
  const handleSpam = () => {
    const savedEmail = email;
    act("spam");
    onToast?.("Conversation reported as spam.", {
      label: "Undo",
      onClick: () => {
        onRestoreEmail?.(savedEmail);
        fetch(`${API_URL}/emails/${savedEmail.id}/not-spam`, { method: "POST" }).catch(() => {});
        onToast?.("Action undone.");
      },
    });
    onDelete();
  };
  const handleDelete = () => {
    const savedEmail = email;
    act("trash");
    onToast?.("Conversation moved to Trash.", {
      label: "Undo",
      onClick: () => {
        onRestoreEmail?.(savedEmail);
        fetch(`${API_URL}/emails/${savedEmail.id}/restore`, { method: "POST" }).catch(() => {});
        onToast?.("Action undone.");
      },
    });
    onDelete();
  };
  const handleUnread = () => {
    const emailId = email.id;
    act("mark-unread");
    onToast?.("Marked as unread.", {
      label: "Undo",
      onClick: () => {
        onUpdateEmail?.({ unread: false });
        fetch(`${API_URL}/emails/${emailId}/mark-read${folderParam}`, { method: "POST" }).catch(() => {});
        onToast?.("Action undone.");
      },
    });
    onMarkUnread();
  };
  const handleRead = () => {
    const emailId = email.id;
    act("mark-read");
    onToast?.("Marked as read.", {
      label: "Undo",
      onClick: () => {
        onUpdateEmail?.({ unread: true });
        fetch(`${API_URL}/emails/${emailId}/mark-unread${folderParam}`, { method: "POST" }).catch(() => {});
        onToast?.("Action undone.");
      },
    });
    onClose();
    setShowMoreMenu(false);
  };
  const handleStar = () => {
    act("star");
    setShowMoreMenu(false);
  };

  // ── Thread query ────────────────────────────────────────────────────────────
  const baseSubject = (email.subject || "").replace(/^((Re|Fwd?|Fw|AW|WG):\s*)*/gi, "").trim();
  const { data: threadMsgs = [] } = useQuery({
    queryKey: ["thread", baseSubject],
    queryFn: () => fetch(`${API_URL}/emails/thread?subject=${encodeURIComponent(baseSubject)}`).then(r => r.json()),
    staleTime: 30 * 1000,
    enabled: !!baseSubject,
  });

  // Fallback: always show at least the current email
  const thread = threadMsgs.length > 0 ? threadMsgs : [{ id: email.id, folder, senderName: email.senderName || email.sender, senderEmail: email.senderEmail || "", subject: email.subject, date: email.date, time: email.time, avatar: email.avatar }];

  // Show loading indicator when navigating to an email whose body isn't cached yet
  useEffect(() => {
    const cached = queryClient.getQueryData(["email", email.id, folder]);
    if (!cached) {
      setDetailLoading(true);
      // Fetch in background and clear loading once done
      queryClient.fetchQuery({
        queryKey: ["email", email.id, folder],
        queryFn: () => fetch(`${API_URL}/emails/${email.id}${folderParam}`).then(r => r.json()),
        staleTime: Infinity,
      }).finally(() => setDetailLoading(false));
    } else {
      setDetailLoading(false);
    }
  }, [email.id, folder]); // eslint-disable-line react-hooks/exhaustive-deps

  const openInline = (mode, replySenderEmail, replySenderName, initialBody = "") => {
    const isReply = mode === 'reply';
    const subjectPrefix = isReply ? "Re:" : "Fwd:";
    const subject = email.subject?.startsWith(subjectPrefix)
      ? email.subject
      : `${subjectPrefix} ${email.subject || ""}`;
    const sig = inlineSignatureHtml;
    const sigBlock = sig
      ? `<br/><div data-signature="1" style="padding-top:8px;margin-top:8px;font-size:13px">${sig}</div>`
      : "";
    const bodyWithSig = sigBlock + initialBody;
    setInlineMode(mode);
    setInlineSubject(subject);
    setInlineInitialBody(bodyWithSig);
    setInlineBodyHtml(bodyWithSig);
    setInlineKey(k => k + 1);
    setShowInlineFormatting(false);
    setInlineCc([]);
    setInlineBcc([]);
    setShowInlineCc(false);
    setShowInlineBcc(false);
    setInlineRecipients(
      isReply && replySenderEmail
        ? [{ email: replySenderEmail, name: replySenderName || replySenderEmail }]
        : []
    );
    if (inlineContacts.length === 0) {
      fetch(`${API_URL}/contacts`).then(r => r.json()).then(setInlineContacts).catch(() => {});
    }
  };

  const handleReply = (senderEmail, senderName) => openInline('reply', senderEmail, senderName);
  const handleForward = (body) => {
    if (body !== undefined) lastForwardBodyRef.current = body;
    openInline('forward', undefined, undefined, lastForwardBodyRef.current);
  };

  const handleBottomForward = async () => {
    const lastMsg = thread[thread.length - 1];
    const lastFolderParam = lastMsg.folder === "sent" ? "?folder=sent" : lastMsg.folder === "trash" ? "?folder=trash" : lastMsg.folder === "spam" ? "?folder=spam" : "";
    let detail = queryClient.getQueryData(["email", lastMsg.id, lastMsg.folder]);
    if (!detail) {
      detail = await fetch(`${API_URL}/emails/${lastMsg.id}${lastFolderParam}`).then(r => r.json());
    }
    const sName = detail?.senderName || lastMsg.senderName || "";
    const sEmail = detail?.senderEmail || lastMsg.senderEmail || "";
    const toEmail = detail?.toEmail || "";
    const fullDate = detail?.date
      ? new Date(detail.date).toLocaleString([], { weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })
      : lastMsg.time;
    const origBody = detail?.html
      ? detail.html
      : `<pre style="font-size:13px;white-space:pre-wrap">${(detail?.text || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>`;
    const header = `<div style="color:#5f6368;font-size:13px;border-left:none;padding:0;margin-bottom:8px">---------- Forwarded message ---------<br>From: <b>${sName}</b> &lt;${sEmail}&gt;<br>Date: ${fullDate}<br>Subject: ${lastMsg.subject || ""}<br>To: ${toEmail}</div>`;
    handleForward(`<br><br>${header}${origBody}`);
  };

  const handleInlineSend = () => {
    const draft = { recipients: inlineRecipients, cc: inlineCc, bcc: inlineBcc, subject: inlineSubject, body: inlineBodyHtml, attachments: [] };
    if (inlineMode === 'reply') onReply(draft);
    else onForward(draft);
    setInlineMode(null);
  };

  const handleInlineDiscard = () => {
    setInlineMode(null);
  };

  const openMoveMenu = async () => {
    setShowMoveMenu(true);
    if (mailboxes.length === 0) {
      const res = await fetch(`${API_URL}/mailboxes`);
      const data = await res.json();
      setMailboxes(
        data.filter(
          (m) =>
            !m.specialUse?.includes("\\Sent") &&
            !m.specialUse?.includes("\\Drafts"),
        ),
      );
    }
  };

  const handleMove = (mailboxPath) => {
    setShowMoveMenu(false);
    fetch(`${API_URL}/emails/${email.id}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mailbox: mailboxPath }),
    }).catch(e => console.error(e));
    onDelete();
  };

  const iconBtn = (onClick, title, children) => (
    <Tooltip key={title} label={title} position="bottom">
      <button
        onClick={onClick}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#5f6368",
          width: 40,
          height: 40,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = "rgba(0,0,0,0.08)")
        }
        onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
      >
        {children}
      </button>
    </Tooltip>
  );

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        background: "#fff",
        minWidth: 0,
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      {/* Loading bar — shown while navigating to an uncached email */}
      <div style={{ height: 3, background: "transparent", flexShrink: 0, overflow: "hidden" }}>
        {detailLoading && (
          <div style={{
            height: "100%",
            background: "#1a73e8",
            animation: "gmail-loading 1.4s ease-in-out infinite",
            width: "40%",
          }} />
        )}
      </div>

      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "4px 8px",
          borderBottom: "0.5px solid #e0e0e0",
          gap: 0,
          flexShrink: 0,
          position: "relative",
        }}
      >
        {/* Back */}
        {iconBtn(onClose, "Back to Inbox", <MdArrowBack size={20} />)}

        <div style={{ width: 8 }} />

        {/* Primary actions */}
        {folder === "spam" ? (
          <>
            {iconBtn(async () => { await act("not-spam"); onToast?.("Conversation moved to Inbox."); onDelete(); }, "Not spam", <MdInbox size={20} />)}
            {iconBtn(async () => { await act("delete-forever"); onToast?.("Conversation permanently deleted."); onDelete(); }, "Delete forever", <MdDelete size={20} />)}
          </>
        ) : (
          <>
            {iconBtn(handleArchive, "Archive", <MdArchive size={20} />)}
            {iconBtn(handleSpam, "Report spam", <MdReport size={20} />)}
            {iconBtn(handleDelete, "Delete", <MdDelete size={20} />)}
          </>
        )}

        <div
          style={{
            width: 1,
            height: 24,
            background: "#e0e0e0",
            margin: "0 4px",
          }}
        />

        {/* Secondary actions */}
        {iconBtn(
          handleUnread,
          "Mark as unread",
          <MdMarkEmailUnread size={20} />,
        )}
        {iconBtn(() => {}, "Snooze", <MdAccessTime size={20} />)}

        <div
          style={{
            width: 1,
            height: 24,
            background: "#e0e0e0",
            margin: "0 4px",
          }}
        />

        {/* Move to */}
        <div style={{ position: "relative" }}>
          {iconBtn(openMoveMenu, "Move to", <MdDriveFileMove size={20} />)}
          {showMoveMenu && (
            <>
              <div
                onClick={() => setShowMoveMenu(false)}
                style={{ position: "fixed", inset: 0, zIndex: 99 }}
              />
              <div
                style={{
                  position: "absolute",
                  top: 44,
                  left: 0,
                  background: "#fff",
                  borderRadius: 8,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
                  zIndex: 100,
                  minWidth: 220,
                  maxHeight: 320,
                  overflowY: "auto",
                  padding: "4px 0",
                  border: "0.5px solid #e0e0e0",
                }}
              >
                <div
                  style={{
                    padding: "8px 16px 4px",
                    fontSize: 12,
                    color: "#5f6368",
                    fontWeight: 500,
                  }}
                >
                  Move to
                </div>
                {mailboxes.length === 0 ? (
                  <div
                    style={{
                      padding: "10px 20px",
                      fontSize: 14,
                      color: "#5f6368",
                    }}
                  >
                    Loading...
                  </div>
                ) : (
                  mailboxes.map((mb) => (
                    <div
                      key={mb.path}
                      onClick={() => handleMove(mb.path)}
                      style={{
                        padding: "10px 20px",
                        fontSize: 14,
                        color: "#202124",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#f1f3f4")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <MdOutbox size={16} color="#5f6368" />
                      {mb.name}
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        {iconBtn(() => {}, "Labels", <MdLabel size={20} />)}

        <div
          style={{
            width: 1,
            height: 24,
            background: "#e0e0e0",
            margin: "0 4px",
          }}
        />

        {/* More */}
        <div style={{ position: "relative" }}>
          {iconBtn(
            () => setShowMoreMenu((v) => !v),
            "More",
            <MdMoreVert size={20} />,
          )}
          {showMoreMenu && (
            <>
              <div
                onClick={() => setShowMoreMenu(false)}
                style={{ position: "fixed", inset: 0, zIndex: 99 }}
              />
              <div
                style={{
                  position: "absolute",
                  top: 44,
                  left: 0,
                  background: "#fff",
                  borderRadius: 8,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
                  zIndex: 100,
                  minWidth: 220,
                  padding: "4px 0",
                  border: "0.5px solid #e0e0e0",
                }}
              >
                {[
                  { label: "Mark as read", action: handleRead },
                  { label: "Add star", action: handleStar },
                  {
                    label: "Print",
                    action: () => {
                      window.print();
                      setShowMoreMenu(false);
                    },
                  },
                  {
                    label: "Report phishing",
                    action: () => {
                      handleSpam();
                    },
                  },
                  {
                    label: "Filter messages like these",
                    action: () => setShowMoreMenu(false),
                  },
                  { label: "Mute", action: () => setShowMoreMenu(false) },
                ].map(({ label, action }) => (
                  <div
                    key={label}
                    onClick={action}
                    style={{
                      padding: "10px 20px",
                      fontSize: 14,
                      color: "#202124",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#f1f3f4")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    {label}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Spacer + prev/next navigation */}
        <div style={{ flex: 1 }} />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            color: "#5f6368",
            fontSize: 13,
          }}
        >
          {emailPosition != null && totalEmails != null && (
            <span style={{ marginRight: 4, whiteSpace: "nowrap" }}>
              {emailPosition} of {totalEmails}
            </span>
          )}
          <button
            onClick={onPrev}
            disabled={!onPrev}
            title="Newer"
            style={{
              background: "none",
              border: "none",
              cursor: onPrev ? "pointer" : "default",
              borderRadius: "50%",
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: onPrev ? "#5f6368" : "#bdbdbd",
            }}
            onMouseEnter={(e) => {
              if (onPrev) e.currentTarget.style.background = "rgba(0,0,0,0.08)";
            }}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            <MdKeyboardArrowLeft size={20} />
          </button>
          <button
            onClick={onNext}
            disabled={!onNext}
            title="Older"
            style={{
              background: "none",
              border: "none",
              cursor: onNext ? "pointer" : "default",
              borderRadius: "50%",
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: onNext ? "#5f6368" : "#bdbdbd",
            }}
            onMouseEnter={(e) => {
              if (onNext) e.currentTarget.style.background = "rgba(0,0,0,0.08)";
            }}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            <MdKeyboardArrowRight size={20} />
          </button>
        </div>

      </div>

      {/* Subject line */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "12px 24px 4px",
          gap: 12,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: 22,
            fontWeight: 500,
            color: "#202124",
            flex: 1,
            lineHeight: 1.3,
          }}
        >
          {email.subject}
          {thread.length > 1 && (
            <span style={{ fontSize: 16, fontWeight: 400, color: "#5f6368", marginLeft: 8 }}>
              {thread.length}
            </span>
          )}
        </span>
        {email.label && email.label !== "inbox" && (
          <span
            style={{
              fontSize: 11,
              padding: "2px 8px",
              borderRadius: 4,
              fontWeight: 500,
              background: LABEL_STYLES[email.label]?.bg,
              color: LABEL_STYLES[email.label]?.color,
              flexShrink: 0,
            }}
          >
            {email.label.charAt(0).toUpperCase() + email.label.slice(1)}
          </span>
        )}
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: "auto", minHeight: 0, padding: "16px 24px 24px" }}>
        {/* Loading skeleton while fetching navigated email */}
        {detailLoading && (
          <div style={{ padding: "8px 0" }}>
            <style>{`
              @keyframes shimmer {
                0%   { background-position: -600px 0; }
                100% { background-position: 600px 0; }
              }
              .skeleton {
                background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                background-size: 600px 100%;
                animation: shimmer 1.4s infinite linear;
                border-radius: 6px;
              }
            `}</style>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div className="skeleton" style={{ width: 40, height: 40, borderRadius: "50%", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton" style={{ height: 14, width: "40%", marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 12, width: "25%" }} />
              </div>
            </div>
            <div className="skeleton" style={{ height: 13, width: "90%", marginBottom: 10 }} />
            <div className="skeleton" style={{ height: 13, width: "80%", marginBottom: 10 }} />
            <div className="skeleton" style={{ height: 13, width: "85%", marginBottom: 10 }} />
            <div className="skeleton" style={{ height: 13, width: "60%", marginBottom: 24 }} />
            <div className="skeleton" style={{ height: 13, width: "88%", marginBottom: 10 }} />
            <div className="skeleton" style={{ height: 13, width: "72%", marginBottom: 10 }} />
          </div>
        )}

        {/* Thread messages — oldest first, current message expanded */}
        {thread.map((msg) => (
          <ThreadMessageCard
            key={`${msg.folder}:${msg.id}`}
            msgMeta={msg}
            initialExpanded={msg.id === email.id && msg.folder === folder}
            onReplyClick={(sEmail, sName) => handleReply(sEmail, sName)}
            onForwardClick={(body) => handleForward(body)}
          />
        ))}

        {/* Reply / Forward buttons or inline compose */}
        {inlineMode ? (
          <div
            style={{
              border: "1px solid #c6c6c6",
              borderRadius: 8,
              background: "#fff",
              boxShadow: "0 1px 6px rgba(0,0,0,0.1)",
              overflow: "hidden",
            }}
          >
            {/* Inline compose header */}
            <div
              style={{
                padding: "8px 16px",
                fontSize: 13,
                fontWeight: 500,
                color: "#202124",
                borderBottom: "0.5px solid #e0e0e0",
                background: "#f2f6fc",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span>{inlineMode === 'reply' ? 'Reply' : 'Forward'}</span>
              <button
                onClick={handleInlineDiscard}
                title="Discard"
                style={{ background: "none", border: "none", cursor: "pointer", color: "#5f6368", display: "flex", padding: 2 }}
              >
                <MdClose size={18} />
              </button>
            </div>

            {/* To row */}
            <div style={{ display: "flex", alignItems: "center", borderBottom: "0.5px solid #e0e0e0", padding: "4px 16px", gap: 8 }}>
              <span style={{ fontSize: 13, color: "#5f6368", flexShrink: 0 }}>To</span>
              <ToField
                recipients={inlineRecipients}
                onChange={setInlineRecipients}
                preloaded={inlineContacts}
              />
              <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                {!showInlineCc && (
                  <button onClick={() => setShowInlineCc(true)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#5f6368", padding: "0 4px", fontFamily: "inherit" }}
                    onMouseEnter={e => e.currentTarget.style.color = "#1a73e8"}
                    onMouseLeave={e => e.currentTarget.style.color = "#5f6368"}>Cc</button>
                )}
                {!showInlineBcc && (
                  <button onClick={() => setShowInlineBcc(true)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#5f6368", padding: "0 4px", fontFamily: "inherit" }}
                    onMouseEnter={e => e.currentTarget.style.color = "#1a73e8"}
                    onMouseLeave={e => e.currentTarget.style.color = "#5f6368"}>Bcc</button>
                )}
              </div>
            </div>
            {showInlineCc && (
              <div style={{ display: "flex", alignItems: "center", borderBottom: "0.5px solid #e0e0e0", padding: "4px 16px", gap: 8 }}>
                <span style={{ fontSize: 13, color: "#5f6368", flexShrink: 0 }}>Cc</span>
                <ToField recipients={inlineCc} onChange={setInlineCc} preloaded={inlineContacts} />
                <button onClick={() => { setShowInlineCc(false); setInlineCc([]); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#5f6368", padding: 0, display: "flex", flexShrink: 0 }}><MdClose size={16} /></button>
              </div>
            )}
            {showInlineBcc && (
              <div style={{ display: "flex", alignItems: "center", borderBottom: "0.5px solid #e0e0e0", padding: "4px 16px", gap: 8 }}>
                <span style={{ fontSize: 13, color: "#5f6368", flexShrink: 0 }}>Bcc</span>
                <ToField recipients={inlineBcc} onChange={setInlineBcc} preloaded={inlineContacts} />
                <button onClick={() => { setShowInlineBcc(false); setInlineBcc([]); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#5f6368", padding: 0, display: "flex", flexShrink: 0 }}><MdClose size={16} /></button>
              </div>
            )}

            {/* Subject row (read-only, dimmed) */}
            <div style={{ display: "flex", alignItems: "center", borderBottom: "0.5px solid #e0e0e0", padding: "6px 16px", gap: 8 }}>
              <span style={{ fontSize: 13, color: "#5f6368", flexShrink: 0 }}>Subject</span>
              <span style={{ fontSize: 13, color: "#202124", flex: 1 }}>{inlineSubject}</span>
            </div>

            {/* Body + formatting toolbar */}
            <RichTextEditor
              ref={inlineEditorRef}
              key={inlineKey}
              initialHTML={inlineInitialBody}
              onChange={setInlineBodyHtml}
              fullscreen={false}
              showToolbar={showInlineFormatting}
            />

            {/* Footer */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderTop: "0.5px solid #e0e0e0", flexWrap: "wrap" }}>
              <button onClick={handleInlineSend} style={{ background: "#1a73e8", color: "#fff", border: "none", borderRadius: 20, padding: "8px 20px", fontSize: 13, fontWeight: 500, cursor: "pointer", flexShrink: 0 }}>Send</button>

              {/* Aa */}
              <Tooltip label={showInlineFormatting ? "Hide formatting" : "Formatting options"} position="top">
                <button onClick={() => setShowInlineFormatting(v => !v)}
                  style={{ background: showInlineFormatting ? "#e8f0fe" : "none", border: "none", cursor: "pointer", borderRadius: 4, padding: "5px 8px", fontSize: 13, fontWeight: 700, color: showInlineFormatting ? "#1967d2" : "#5f6368", fontFamily: "Arial, sans-serif", lineHeight: 1, display: "flex", alignItems: "center", gap: 1 }}
                  onMouseEnter={e => { if (!showInlineFormatting) e.currentTarget.style.background = "#f1f3f4"; }}
                  onMouseLeave={e => { if (!showInlineFormatting) e.currentTarget.style.background = "none"; }}
                ><span style={{ fontSize: 15, fontWeight: 700 }}>A</span><span style={{ fontSize: 11, fontWeight: 600 }}>a</span></button>
              </Tooltip>

              {/* Attach */}
              <Tooltip label="Attach files" position="top">
                <button onClick={() => { const i = document.createElement("input"); i.type = "file"; i.multiple = true; i.onchange = () => {}; i.click(); }}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: "6px 8px", borderRadius: "50%", color: "#5f6368", display: "flex", alignItems: "center" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f1f3f4"}
                  onMouseLeave={e => e.currentTarget.style.background = "none"}
                ><MdAttachFile size={18} /></button>
              </Tooltip>

              {/* Insert Link */}
              <Tooltip label="Insert link" position="top">
                <button onClick={() => inlineEditorRef.current?.openLinkDialog()}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: "6px 8px", borderRadius: "50%", color: "#5f6368", display: "flex", alignItems: "center" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f1f3f4"}
                  onMouseLeave={e => e.currentTarget.style.background = "none"}
                ><MdInsertLink size={18} /></button>
              </Tooltip>

              {/* Emoji */}
              <Tooltip label="Insert emoji" position="top">
                <button onClick={() => inlineEditorRef.current?.openEmojiPicker()}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: "6px 8px", borderRadius: "50%", color: "#5f6368", display: "flex", alignItems: "center", fontSize: 16 }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f1f3f4"}
                  onMouseLeave={e => e.currentTarget.style.background = "none"}
                >😊</button>
              </Tooltip>

              {/* Insert Image */}
              <Tooltip label="Insert image" position="top">
                <button onClick={() => inlineEditorRef.current?.triggerImageInsert()}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: "6px 8px", borderRadius: "50%", color: "#5f6368", display: "flex", alignItems: "center" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f1f3f4"}
                  onMouseLeave={e => e.currentTarget.style.background = "none"}
                ><MdImage size={18} /></button>
              </Tooltip>

              {/* Signature */}
              <div style={{ position: "relative" }} ref={inlineSignaturePopoverRef}>
                <Tooltip label="Insert signature" position="top">
                <button onClick={() => { setEditingInlineSignature(false); setShowInlineSignaturePopover(v => !v); }}
                  style={{ background: showInlineSignaturePopover ? "#e8f0fe" : "none", border: "none", cursor: "pointer", padding: "6px 8px", borderRadius: "50%", color: showInlineSignaturePopover ? "#1967d2" : "#5f6368", display: "flex", alignItems: "center" }}
                  onMouseEnter={e => { if (!showInlineSignaturePopover) e.currentTarget.style.background = "#f1f3f4"; }}
                  onMouseLeave={e => { if (!showInlineSignaturePopover) e.currentTarget.style.background = "none"; }}
                ><MdDraw size={18} /></button>
                </Tooltip>
                {showInlineSignaturePopover && (
                  <div style={{ position: "absolute", bottom: "calc(100% + 8px)", left: 0, zIndex: 500, background: "#fff", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.18)", border: "1px solid #e0e0e0", width: 300, padding: "14px 16px" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#202124", marginBottom: 10 }}>Signature</div>
                    {editingInlineSignature ? (
                      <>
                        <div style={{ display: "flex", alignItems: "center", gap: 2, marginBottom: 4 }}>
                          {[{ cmd: "bold", label: <b>B</b> }, { cmd: "italic", label: <i>I</i> }, { cmd: "underline", label: <u>U</u> }].map(({ cmd, label }) => (
                            <button key={cmd} onMouseDown={e => { e.preventDefault(); inlineSignatureEditorRef.current?.focus(); document.execCommand(cmd); }}
                              style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 6px", borderRadius: 3, fontSize: 13, color: "#444746" }}
                              onMouseEnter={e => e.currentTarget.style.background = "#f1f3f4"}
                              onMouseLeave={e => e.currentTarget.style.background = "none"}>{label}</button>
                          ))}
                          <div style={{ width: 1, height: 14, background: "#e0e0e0", margin: "0 2px" }} />
                          <input ref={inlineSignatureImageInputRef} type="file" accept="image/*" style={{ display: "none" }}
                            onChange={e => {
                              const file = e.target.files?.[0]; if (!file) return;
                              const reader = new FileReader();
                              reader.onload = ev => {
                                const el = inlineSignatureEditorRef.current;
                                if (!el) return;
                                el.innerHTML += `<img src="${ev.target.result}" alt="signature" style="max-width:100%;height:auto;vertical-align:middle;" />`;
                                el.focus();
                              };
                              reader.readAsDataURL(file); e.target.value = "";
                            }} />
                          <button onMouseDown={e => { e.preventDefault(); inlineSignatureImageInputRef.current?.click(); }}
                            style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 6px", borderRadius: 3, color: "#444746", display: "flex", alignItems: "center" }}
                            onMouseEnter={e => e.currentTarget.style.background = "#f1f3f4"}
                            onMouseLeave={e => e.currentTarget.style.background = "none"} title="Insert image"><MdImage size={15} /></button>
                        </div>
                        <div ref={inlineSignatureEditorRef} contentEditable suppressContentEditableWarning onInput={() => {}}
                          data-placeholder="Type your signature or insert an image..."
                          style={{ minHeight: 80, maxHeight: 160, overflowY: "auto", border: "1px solid #dadce0", borderRadius: 4, padding: "8px 10px", fontSize: 13, fontFamily: "inherit", outline: "none", lineHeight: 1.5, marginBottom: 10 }}
                          onFocus={e => e.currentTarget.style.borderColor = "#1a73e8"}
                          onBlur={e => e.currentTarget.style.borderColor = "#dadce0"} />
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                          <button onClick={() => setEditingInlineSignature(false)}
                            style={{ padding: "6px 14px", borderRadius: 4, border: "1px solid #dadce0", background: "#fff", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
                            onMouseEnter={e => e.currentTarget.style.background = "#f1f3f4"}
                            onMouseLeave={e => e.currentTarget.style.background = "#fff"}>Cancel</button>
                          <button onClick={() => {
                              const html = inlineSignatureEditorRef.current?.innerHTML || "";
                              setInlineSignatureHtml(html);
                              setEditingInlineSignature(false);
                              fetch(`${API_URL}/signature`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ id: inlineSignatureId || undefined, html, is_default: 1 }),
                              })
                                .then(r => r.json())
                                .then(data => { if (data.id) setInlineSignatureId(data.id); })
                                .catch(() => {});
                            }}
                            style={{ padding: "6px 14px", borderRadius: 4, border: "none", background: "#1a73e8", color: "#fff", fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}
                            onMouseEnter={e => e.currentTarget.style.background = "#1765cc"}
                            onMouseLeave={e => e.currentTarget.style.background = "#1a73e8"}>Save</button>
                        </div>
                      </>
                    ) : (
                      <>
                        {inlineSignatureHtml ? (
                          <div dangerouslySetInnerHTML={{ __html: inlineSignatureHtml }}
                            style={{ fontSize: 13, color: "#202124", background: "#f8f9fa", borderRadius: 4, padding: "8px 10px", marginBottom: 10, maxHeight: 120, overflowY: "auto", wordBreak: "break-word" }} />
                        ) : (
                          <div style={{ fontSize: 13, color: "#5f6368", marginBottom: 10 }}>No signature set.</div>
                        )}
                        <div style={{ display: "flex", gap: 8 }}>
                          {inlineSignatureHtml && (
                            <button onClick={() => {
                                const html = `<br/><div style="padding-top:8px;margin-top:8px;font-size:13px">${inlineSignatureHtml}</div>`;
                                const el = document.querySelector('[data-placeholder="Write your message..."]');
                                if (el) { el.focus(); const sel = window.getSelection(); const range = document.createRange(); range.selectNodeContents(el); range.collapse(false); sel.removeAllRanges(); sel.addRange(range); document.execCommand("insertHTML", false, html); setInlineBodyHtml(el.innerHTML); }
                                setShowInlineSignaturePopover(false);
                              }}
                              style={{ flex: 1, padding: "6px 14px", borderRadius: 4, border: "none", background: "#1a73e8", color: "#fff", fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}
                              onMouseEnter={e => e.currentTarget.style.background = "#1765cc"}
                              onMouseLeave={e => e.currentTarget.style.background = "#1a73e8"}>Insert</button>
                          )}
                          <button onClick={() => { setEditingInlineSignature(true); setTimeout(() => { if (inlineSignatureEditorRef.current) inlineSignatureEditorRef.current.innerHTML = inlineSignatureHtml; }, 0); }}
                            style={{ flex: 1, padding: "6px 14px", borderRadius: 4, border: "1px solid #dadce0", background: "#fff", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
                            onMouseEnter={e => e.currentTarget.style.background = "#f1f3f4"}
                            onMouseLeave={e => e.currentTarget.style.background = "#fff"}>{inlineSignatureHtml ? "Edit" : "Create"}</button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              <Tooltip label="Discard draft" position="top">
                <button onClick={handleInlineDiscard}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#5f6368", display: "flex", padding: 6, marginLeft: "auto", borderRadius: "50%" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f1f3f4"}
                  onMouseLeave={e => e.currentTarget.style.background = "none"}
                ><MdDelete size={18} /></button>
              </Tooltip>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 12, paddingLeft: 4 }}>
            <button
              onClick={() => handleReply(email.senderEmail, email.senderName || email.sender)}
              style={{
                border: "0.5px solid #ccc",
                background: "#fff",
                borderRadius: 20,
                padding: "8px 20px",
                fontSize: 13,
                cursor: "pointer",
                color: "#202124",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <MdReply size={16} /> Reply
            </button>
            <button
              onClick={handleBottomForward}
              style={{
                border: "0.5px solid #ccc",
                background: "#fff",
                borderRadius: 20,
                padding: "8px 20px",
                fontSize: 13,
                cursor: "pointer",
                color: "#202124",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <MdForward size={16} /> Forward
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const PAGE_SIZE = 50;

// Query-key factories
const emailListKey = (nav, page) => ["emails", nav, page];
const emailDetailKey = (id) => ["email", id];

// Shared fetch helper for the email list
async function fetchEmailList(nav, page) {
  let url;
  if (nav === "Starred") url = "/emails/starred";
  else if (nav === "Sent")   url = `/emails/sent?page=${page}`;
  else if (nav === "Drafts") url = `/emails/drafts?page=${page}`;
  else if (nav === "Trash")   url = `/emails/trash?page=${page}`;
  else if (nav === "Spam")    url = `/emails/spam?page=${page}`;
  else if (nav === "Snoozed") url = `/emails/snoozed`;
  else url = `/emails?page=${page}`;

  const res  = await fetch(`${API_URL}${url}`);
  const data = await res.json();
  if (Array.isArray(data)) return { emails: data, total: data.length };
  return { emails: data.emails || [], total: data.total || 0 };
}

// ── Folder badge shown on each search result row ─────────────────────────────
const FOLDER_BADGE = {
  inbox:   { label: "Inbox",   bg: "#e8f0fe", color: "#1967d2" },
  sent:    { label: "Sent",    bg: "#e6f4ea", color: "#137333" },
  drafts:  { label: "Drafts",  bg: "#fce8e6", color: "#c5221f" },
  trash:   { label: "Trash",   bg: "#f1f3f4", color: "#5f6368" },
  spam:    { label: "Spam",    bg: "#fef7e0", color: "#b06000" },
};

function SearchOverlay({
  query, page, setPage, emails, totalEmails, loading,
  selectedId, setSelectedId, onClose, showToast, patchList, queryClient,
}) {
  const PAGE_SIZE = 50;
  const totalPages = Math.ceil(totalEmails / PAGE_SIZE) || 1;
  const pageStart  = totalEmails === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const pageEnd    = Math.min(page * PAGE_SIZE, totalEmails);

  const selectedEmail = emails.find((e) => e.id === selectedId) || null;

  // Determine the folder for EmailDetail
  const folderForDetail = selectedEmail?.folder || selectedEmail?.label || "inbox";

  // When an email is selected, show it full-width
  if (selectedId) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#fff", borderRadius: "16px 16px 0 0", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflow: "hidden", minWidth: 0 }}>
        {selectedEmail ? (
          <EmailDetail
            email={selectedEmail}
            onClose={() => setSelectedId(null)}
            onReply={() => {}}
            onForward={() => {}}
            onDelete={() => { patchList((list) => list.filter((em) => em.id !== selectedEmail.id)); setSelectedId(null); }}
            onToast={showToast}
            onRestoreEmail={(emailData) => patchList((list) => [emailData, ...list])}
            onUpdateEmail={(updates) => patchList((list) => list.map((em) => em.id === selectedEmail.id ? { ...em, ...updates } : em))}
            onMarkUnread={() => { patchList((list) => list.map((em) => em.id === selectedEmail.id ? { ...em, unread: true } : em)); setSelectedId(null); }}
            folder={folderForDetail}
            emailPosition={null}
            totalEmails={null}
            onPrev={null}
            onNext={null}
          />
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#5f6368", fontSize: 14 }}>Loading…</div>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        background: "#f6f8fc",
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      {/* Results list — full width */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          background: "#fff",
          borderRadius: "16px 16px 0 0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          overflow: "hidden",
        }}
      >
        {/* Results header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "10px 16px",
            borderBottom: "1px solid #e0e0e0",
            gap: 10,
            flexShrink: 0,
          }}
        >
          <MdSearch size={20} color="#1a73e8" />
          <span style={{ fontSize: 14, color: "#202124", fontWeight: 500, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            Search results for &ldquo;{query}&rdquo;
          </span>
          {!loading && totalEmails > 0 && (
            <span style={{ fontSize: 13, color: "#5f6368", flexShrink: 0, marginRight: 4 }}>
              {pageStart}–{pageEnd} of {totalEmails}
            </span>
          )}
          {/* Pagination arrows */}
          {totalPages > 1 && (
            <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
              <button
                onClick={() => { setPage((p) => Math.max(1, p - 1)); setSelectedId(null); }}
                disabled={page === 1}
                style={{ background: "none", border: "none", cursor: page === 1 ? "default" : "pointer", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", color: page === 1 ? "#bdbdbd" : "#5f6368" }}
              >
                <MdKeyboardArrowLeft size={18} />
              </button>
              <button
                onClick={() => { setPage((p) => Math.min(totalPages, p + 1)); setSelectedId(null); }}
                disabled={page === totalPages}
                style={{ background: "none", border: "none", cursor: page === totalPages ? "default" : "pointer", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", color: page === totalPages ? "#bdbdbd" : "#5f6368" }}
              >
                <MdKeyboardArrowRight size={18} />
              </button>
            </div>
          )}
          <button
            onClick={onClose}
            title="Close search"
            style={{ background: "none", border: "none", cursor: "pointer", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", color: "#5f6368", flexShrink: 0 }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f3f4")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            <MdClose size={20} />
          </button>
        </div>

        {/* Results body */}
        <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
          {loading && (
            <div style={{ padding: 40, textAlign: "center", color: "#5f6368", fontSize: 14 }}>
              Searching for &ldquo;{query}&rdquo;…
            </div>
          )}
          {!loading && emails.length === 0 && (
            <div style={{ padding: 48, textAlign: "center" }}>
              <MdSearch size={48} color="#dadce0" style={{ marginBottom: 12 }} />
              <div style={{ fontSize: 16, color: "#202124", fontWeight: 500, marginBottom: 6 }}>
                No results for &ldquo;{query}&rdquo;
              </div>
              <div style={{ fontSize: 14, color: "#5f6368" }}>
                Try different keywords or check for typos.
              </div>
            </div>
          )}
          {!loading && emails.map((email) => {
            const badge   = FOLDER_BADGE[email.folder] || FOLDER_BADGE[email.label] || FOLDER_BADGE.inbox;
            const isSelected = email.id === selectedId;
            return (
              <div
                key={`${email.folder}:${email.id}`}
                onClick={() => setSelectedId(email.id)}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  padding: "12px 16px",
                  borderBottom: "0.5px solid #f0f0f0",
                  cursor: "pointer",
                  background: isSelected ? "#e8f0fe" : email.unread ? "#fff" : "#f6f8fc",
                  fontWeight: email.unread ? 600 : 400,
                  transition: "background 0.1s",
                  borderLeft: isSelected ? "3px solid #1a73e8" : "3px solid transparent",
                }}
                onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "#f2f6fc"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = isSelected ? "#e8f0fe" : email.unread ? "#fff" : "#f6f8fc"; }}
              >
                {/* Unread dot */}
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: email.unread ? "#1a73e8" : "transparent", flexShrink: 0, marginTop: 6 }} />
                {/* Avatar */}
                <Avatar initials={email.avatar} color={email.avatarColor} size={32} />
                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                    <span style={{ fontSize: 13, color: "#202124", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, minWidth: 0 }}>
                      {email.senderName || email.sender}
                    </span>
                    {/* Folder badge */}
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "1px 7px", borderRadius: 10, background: badge.bg, color: badge.color, flexShrink: 0, letterSpacing: 0.2 }}>
                      {badge.label}
                    </span>
                    <span style={{ fontSize: 12, color: "#5f6368", flexShrink: 0, whiteSpace: "nowrap" }}>
                      {email.time}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, overflow: "hidden" }}>
                    {email.starred && <MdStar size={14} color="#F4B400" style={{ flexShrink: 0 }} />}
                    <span style={{ fontSize: 13, color: "#202124", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {email.subject}
                    </span>
                    <span style={{ color: "#ccc", fontSize: 12, flexShrink: 0 }}>—</span>
                    <span style={{ fontSize: 13, color: "#5f6368", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {email.preview}
                    </span>
                  </div>
                  {email.hasAttachment && (
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
                      <MdAttachFile size={13} color="#5f6368" />
                      <span style={{ fontSize: 12, color: "#5f6368" }}>
                        {email.attachments?.map(a => a.filename).filter(Boolean).slice(0, 2).join(", ")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}

// ── Settings Modal ────────────────────────────────────────────────────────────
function SettingsModal({ onClose, readingPane, setReadingPane }) {
  const [activeTab, setActiveTab] = useState("general");

  // ── Signature state ────────────────────────────────────────────────
  const [signatures, setSignatures] = useState([]);
  const [editingId, setEditingId] = useState(null); // null = new, number = existing
  const [editName, setEditName] = useState("Default");
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const sigEditorRef = useRef(null);
  const sigImgInputRef = useRef(null);

  // Load signatures from backend
  useEffect(() => {
    fetch(`${API_URL}/signatures`)
      .then(r => r.json())
      .then(rows => {
        setSignatures(rows);
        if (rows.length === 0) {
          // Start in create mode
          setEditingId(null);
          setEditName("Default");
          setIsDefault(true);
        }
      })
      .catch(() => {});
  }, []);

  const startNew = () => {
    setEditingId(null);
    setEditName("Default");
    setIsDefault(signatures.length === 0);
    setSaveMsg("");
    if (sigEditorRef.current) sigEditorRef.current.innerHTML = "";
  };

  const startEdit = (sig) => {
    setEditingId(sig.id);
    setEditName(sig.name);
    setIsDefault(sig.is_default === 1);
    setSaveMsg("");
    setTimeout(() => {
      if (sigEditorRef.current) sigEditorRef.current.innerHTML = sig.html;
    }, 0);
  };

  const handleSave = async () => {
    const html = sigEditorRef.current?.innerHTML || "";
    setSaving(true);
    setSaveMsg("");
    try {
      const res = await fetch(`${API_URL}/signature`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId || undefined, name: editName, html, is_default: isDefault }),
      });
      const data = await res.json();
      if (data.ok) {
        setSaveMsg("Saved!");
        // Reload list
        const rows = await fetch(`${API_URL}/signatures`).then(r => r.json());
        setSignatures(rows);
        if (!editingId) setEditingId(data.id);
      }
    } catch {
      setSaveMsg("Error saving.");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(""), 2500);
    }
  };

  const handleDelete = async (id) => {
    await fetch(`${API_URL}/signature/${id}`, { method: "DELETE" });
    const rows = await fetch(`${API_URL}/signatures`).then(r => r.json());
    setSignatures(rows);
    if (editingId === id) startNew();
  };

  const execCmd = (cmd, val) => {
    sigEditorRef.current?.focus();
    document.execCommand(cmd, false, val || null);
  };

  const TABS = ["general", "signature"];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 2000 }}
      />
      {/* Modal */}
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        background: "#fff", borderRadius: 12, boxShadow: "0 8px 40px rgba(0,0,0,0.22)",
        zIndex: 2001, width: 680, maxWidth: "96vw", maxHeight: "88vh",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", padding: "18px 24px 14px", borderBottom: "1px solid #e0e0e0" }}>
          <span style={{ fontSize: 18, fontWeight: 600, color: "#202124", flex: 1 }}>Settings</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#5f6368", padding: 4, borderRadius: "50%", display: "flex" }}
            onMouseEnter={e => e.currentTarget.style.background = "#f1f3f4"}
            onMouseLeave={e => e.currentTarget.style.background = "none"}>
            <MdClose size={22} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid #e0e0e0", padding: "0 24px" }}>
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{
                background: "none", border: "none", cursor: "pointer", padding: "10px 16px",
                fontSize: 14, fontWeight: 500, color: activeTab === tab ? "#1a73e8" : "#5f6368",
                borderBottom: activeTab === tab ? "2px solid #1a73e8" : "2px solid transparent",
                fontFamily: "inherit", marginBottom: -1,
              }}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>

          {activeTab === "general" && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#202124", marginBottom: 20 }}>Reading pane</div>
              <label style={{ display: "flex", alignItems: "center", gap: 14, cursor: "pointer", padding: "14px 16px", borderRadius: 8, border: "1px solid #e0e0e0", background: readingPane ? "#f0f7ff" : "#fff", transition: "background 0.15s" }}>
                <div
                  onClick={() => setReadingPane(!readingPane)}
                  style={{
                    width: 44, height: 24, borderRadius: 12, flexShrink: 0,
                    background: readingPane ? "#1a73e8" : "#bdc1c6",
                    position: "relative", cursor: "pointer", transition: "background 0.2s",
                  }}
                >
                  <div style={{
                    position: "absolute", top: 2, left: readingPane ? 22 : 2,
                    width: 20, height: 20, borderRadius: "50%", background: "#fff",
                    transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                  }} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "#202124" }}>Enable reading pane</div>
                  <div style={{ fontSize: 13, color: "#5f6368", marginTop: 2 }}>Show email content in a side panel next to the message list, like Outlook</div>
                </div>
              </label>
            </div>
          )}

          {activeTab === "signature" && (
            <div style={{ display: "flex", gap: 20, minHeight: 340 }}>
              {/* Left: signature list */}
              <div style={{ width: 180, flexShrink: 0, borderRight: "1px solid #e8eaed", paddingRight: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#5f6368", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Signatures</div>
                {signatures.map(sig => (
                  <div key={sig.id}
                    onClick={() => startEdit(sig)}
                    style={{
                      padding: "8px 10px", borderRadius: 6, cursor: "pointer", marginBottom: 4,
                      background: editingId === sig.id ? "#e8f0fe" : "none",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                    }}
                    onMouseEnter={e => { if (editingId !== sig.id) e.currentTarget.style.background = "#f1f3f4"; }}
                    onMouseLeave={e => { if (editingId !== sig.id) e.currentTarget.style.background = "none"; }}>
                    <div>
                      <div style={{ fontSize: 13, color: "#202124", fontWeight: editingId === sig.id ? 600 : 400 }}>{sig.name}</div>
                      {sig.is_default === 1 && <div style={{ fontSize: 11, color: "#1a73e8" }}>Default</div>}
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(sig.id); }}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#5f6368", padding: 2, borderRadius: "50%", display: "flex" }}
                      title="Delete">
                      <MdClose size={14} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={startNew}
                  style={{
                    marginTop: 8, width: "100%", background: "none", border: "1px dashed #c5c8cd",
                    borderRadius: 6, cursor: "pointer", padding: "7px 10px", fontSize: 13,
                    color: "#1a73e8", display: "flex", alignItems: "center", gap: 4, fontFamily: "inherit",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f1f3f4"}
                  onMouseLeave={e => e.currentTarget.style.background = "none"}>
                  <MdAdd size={16} /> New signature
                </button>
              </div>

              {/* Right: editor */}
              <div style={{ flex: 1 }}>
                {/* Name */}
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 13, color: "#5f6368", display: "block", marginBottom: 4 }}>Signature name</label>
                  <input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    style={{ width: "100%", padding: "7px 10px", border: "1px solid #dadce0", borderRadius: 6, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
                    onFocus={e => e.target.style.borderColor = "#1a73e8"}
                    onBlur={e => e.target.style.borderColor = "#dadce0"}
                    placeholder="Signature name"
                  />
                </div>

                {/* Rich-text toolbar */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 2, marginBottom: 6, padding: "4px 6px", border: "1px solid #dadce0", borderBottom: "none", borderRadius: "6px 6px 0 0", background: "#f8f9fa" }}>
                  {[
                    { cmd: "bold", icon: <MdFormatBold size={18} />, title: "Bold" },
                    { cmd: "italic", icon: <MdFormatItalic size={18} />, title: "Italic" },
                    { cmd: "underline", icon: <MdFormatUnderlined size={18} />, title: "Underline" },
                  ].map(({ cmd, icon, title }) => (
                    <button key={cmd} onMouseDown={e => { e.preventDefault(); execCmd(cmd); }}
                      title={title}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: "3px 5px", borderRadius: 4, color: "#5f6368", display: "flex" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#e8eaed"}
                      onMouseLeave={e => e.currentTarget.style.background = "none"}>
                      {icon}
                    </button>
                  ))}
                  <div style={{ width: 1, background: "#e0e0e0", margin: "2px 4px" }} />
                  <select onChange={e => execCmd("fontSize", e.target.value)} defaultValue=""
                    style={{ border: "none", background: "none", fontSize: 12, color: "#5f6368", cursor: "pointer", padding: "2px 2px" }}>
                    <option value="" disabled>Size</option>
                    {[1,2,3,4,5].map(s => <option key={s} value={s}>{["Tiny","Small","Normal","Large","Huge"][s-1]}</option>)}
                  </select>
                  <div style={{ width: 1, background: "#e0e0e0", margin: "2px 4px" }} />
                  <label title="Insert image" style={{ cursor: "pointer", display: "flex", alignItems: "center", padding: "3px 5px", borderRadius: 4, color: "#5f6368" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#e8eaed"}
                    onMouseLeave={e => e.currentTarget.style.background = "none"}>
                    <MdImage size={18} />
                    <input ref={sigImgInputRef} type="file" accept="image/*" style={{ display: "none" }}
                      onChange={ev => {
                        const file = ev.target.files[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = e2 => {
                          const el = sigEditorRef.current;
                          if (!el) return;
                          el.innerHTML += `<img src="${e2.target.result}" alt="signature" style="max-width:100%;height:auto;vertical-align:middle;" />`;
                          el.focus();
                        };
                        reader.readAsDataURL(file);
                        ev.target.value = "";
                      }} />
                  </label>
                </div>

                {/* Editor */}
                <div
                  ref={sigEditorRef}
                  contentEditable
                  suppressContentEditableWarning
                  data-placeholder="Create your email signature..."
                  style={{
                    minHeight: 140, border: "1px solid #dadce0", borderRadius: "0 0 6px 6px",
                    padding: "10px 12px", fontSize: 14, outline: "none", lineHeight: 1.6,
                    fontFamily: "inherit", overflowY: "auto",
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = "#1a73e8"}
                  onBlur={e => e.currentTarget.style.borderColor = "#dadce0"}
                />

                {/* Default checkbox */}
                <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, cursor: "pointer", fontSize: 14, color: "#202124" }}>
                  <input type="checkbox" checked={isDefault} onChange={e => setIsDefault(e.target.checked)} style={{ width: 15, height: 15, accentColor: "#1a73e8" }} />
                  Use as default signature
                </label>

                {/* Save button */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                      background: "#1a73e8", color: "#fff", border: "none", borderRadius: 6,
                      padding: "9px 22px", fontSize: 14, fontWeight: 500, cursor: saving ? "default" : "pointer",
                      opacity: saving ? 0.7 : 1, fontFamily: "inherit",
                    }}
                    onMouseEnter={e => { if (!saving) e.currentTarget.style.background = "#1765cc"; }}
                    onMouseLeave={e => e.currentTarget.style.background = saving ? "#1a73e8" : "#1a73e8"}>
                    {saving ? "Saving…" : "Save changes"}
                  </button>
                  {saveMsg && <span style={{ fontSize: 13, color: saveMsg === "Saved!" ? "#188038" : "#c5221f" }}>{saveMsg}</span>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function GmailUI({ userEmail, onLogout }) {
  const queryClient = useQueryClient();

  // ── Restore state from URL hash on first load ────────────────────────────────
  const VALID_FOLDERS = new Set(["Inbox","Starred","Snoozed","Sent","Drafts","Trash","Spam","All Mail"]);
  const parseHash = () => {
    const [folder, rawId] = window.location.hash.slice(1).split("/");
    return {
      folder: VALID_FOLDERS.has(folder) ? folder : "Inbox",
      id: rawId ? parseInt(rawId, 10) || null : null,
    };
  };
  const { folder: _initFolder, id: _initId } = parseHash();

  const [selectedId, setSelectedId] = useState(_initId);
  const [checkedIds, setCheckedIds] = useState(new Set());
  const [hoveredId, setHoveredId] = useState(null);
  const [showSelectDropdown, setShowSelectDropdown] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [unsubscribeTarget, setUnsubscribeTarget] = useState(null);
  const [unsubscribing, setUnsubscribing] = useState(false);
  const [snoozeTarget, setSnoozeTarget] = useState(null); // { id, folder }
  const [currentPage, setCurrentPage] = useState(1);
  const [autoPageRedirecting, setAutoPageRedirecting] = useState(false);
  const [activeNav, setActiveNav] = useState(_initFolder);
  const [showMoreNav, setShowMoreNav] = useState(
    NAV_ITEMS_MORE.some(i => i.label === _initFolder)
  );
  const [showCompose, setShowCompose] = useState(false);
  const [composeMinimized, setComposeMinimized] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showHelpMenu, setShowHelpMenu] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [supportEnabled, setSupportEnabled] = useState(() => localStorage.getItem("support_panel") === "true");
  const helpBtnRef = useRef(null);
  const toggleSupport = (val) => { setSupportEnabled(val); localStorage.setItem("support_panel", val ? "true" : "false"); };
  const [readingPane, setReadingPaneState] = useState(false);
  const [listPaneWidth, setListPaneWidth] = useState(() => parseInt(localStorage.getItem("reading_pane_width")) || 380);
  const [isPaneDragging, setIsPaneDragging] = useState(false);
  const paneDragRef = useRef({ active: false, startX: 0, startWidth: 0 });

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!paneDragRef.current.active) return;
      const delta = e.clientX - paneDragRef.current.startX;
      const next = Math.max(240, Math.min(700, paneDragRef.current.startWidth + delta));
      setListPaneWidth(next);
    };
    const onMouseUp = () => {
      if (!paneDragRef.current.active) return;
      paneDragRef.current.active = false;
      setIsPaneDragging(false);
      setListPaneWidth(w => { localStorage.setItem("reading_pane_width", String(w)); return w; });
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => { window.removeEventListener("mousemove", onMouseMove); window.removeEventListener("mouseup", onMouseUp); };
  }, []);
  const setReadingPane = (val) => {
    setReadingPaneState(val);
    fetch(`${API_URL}/user-settings`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ readingPane: val }),
    }).catch(() => {});
  };
  useEffect(() => {
    fetch(`${API_URL}/user-settings`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setReadingPaneState(data.readingPane); })
      .catch(() => {});
  }, []);
  const [toast, setToast] = useState(null); // null | { message, actions: [{label,onClick}] }
  const toastTimer = useRef(null);
  const pendingOpenLatestSent = useRef(false);

  // ── Undo-send state ──────────────────────────────────────────────────────────
  const UNDO_DELAY = 5000; // ms — same as Gmail default
  const [composeDraft, setComposeDraft] = useState(null);
  const [composeKey, setComposeKey] = useState(0);
  const undoTimer = useRef(null);

  const executeSend = async (draft) => {
    const fd = new FormData();
    fd.append("to", draft.recipients.map((r) => r.email).join(", "));
    if (draft.cc?.length)  fd.append("cc",  draft.cc.map((r) => r.email).join(", "));
    if (draft.bcc?.length) fd.append("bcc", draft.bcc.map((r) => r.email).join(", "));
    fd.append("subject", draft.subject);
    fd.append("html", draft.body);
    fd.append("text", draft.body.replace(/<[^>]*>/g, ""));
    draft.attachments.forEach((f) => fd.append("attachments", f));
    try {
      await fetch(`${API_URL}/send-email`, { method: "POST", body: fd });
      if (draft.recipients.length > 0) {
        fetch(`${API_URL}/contacts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draft.recipients),
        }).catch(() => {});
      }
      // If this was sent from a draft, remove the original draft from IMAP
      if (draft.draftUid) {
        fetch(`${API_URL}/emails/${draft.draftUid}/trash?folder=drafts`, { method: "POST" })
          .then(() => queryClient.invalidateQueries({ queryKey: ["emails", "Drafts"] }))
          .catch(() => {});
      }
    } catch (err) {
      console.error("Failed to send email:", err);
    }
  };

  const handlePendingSend = (draft) => {
    clearTimeout(undoTimer.current);

    // Optimistically remove from Drafts list the moment the user hits Send
    if (draft.draftUid) {
      queryClient.setQueryData(emailListKey("Drafts", 1), (old) =>
        old ? { ...old, emails: old.emails.filter((e) => e.id !== draft.draftUid), total: Math.max(0, (old.total || 1) - 1) } : old,
      );
    }

    const doUndo = () => {
      clearTimeout(undoTimer.current);
      setToast(null);
      setComposeDraft(draft);
      setComposeKey((k) => k + 1);
      setShowCompose(true);
      setComposeMinimized(false);
    };

    const doView = () => {
      clearTimeout(undoTimer.current);
      setToast(null);
      executeSend(draft).then(() => {
        pendingOpenLatestSent.current = true;
        setSelectedId(null);
        setCurrentPage(1);
        setActiveNav("Sent");
        queryClient.invalidateQueries({ queryKey: ["emails", "Sent"] });
      });
    };

    setToast({
      message: "Message sent",
      actions: [
        { label: "Undo", onClick: doUndo },
        { label: "View message", onClick: doView },
      ],
    });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), UNDO_DELAY);

    undoTimer.current = setTimeout(() => {
      executeSend(draft).then(() => {
        // Refresh Sent folder and thread view so the sent message appears immediately
        queryClient.invalidateQueries({ queryKey: ["emails", "Sent"] });
        const base = (draft.subject || "").replace(/^((Re|Fwd?|Fw|AW|WG):\s*)*/gi, "").trim();
        if (base) queryClient.invalidateQueries({ queryKey: ["thread", base] });
      });
    }, UNDO_DELAY);
  };

  const showToast = (message, actions = []) => {
    clearTimeout(toastTimer.current);
    setToast({ message, actions: Array.isArray(actions) ? actions : [actions] });
    toastTimer.current = setTimeout(() => setToast(null), 5000);
  };
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchPage, setSearchPage] = useState(1);
  const [searchSelectedId, setSearchSelectedId] = useState(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const [contactSuggestions, setContactSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [advancedFields, setAdvancedFields] = useState({ from: "", to: "", subject: "", hasWords: "", noWords: "", hasAttachment: false, dateAfter: "", dateBefore: "" });
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);
  const emailListRef = useRef(null);
  const savedScrollTop = useRef(0);

  // Debounce search input — fire backend query 400ms after user stops typing
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setSearchPage(1); setSearchSelectedId(null); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  // Fetch contact suggestions as user types
  useEffect(() => {
    if (!search.trim()) { setContactSuggestions([]); return; }
    const t = setTimeout(() => {
      fetch(`${API_URL}/contacts?q=${encodeURIComponent(search.trim())}`)
        .then(r => r.json())
        .then(d => setContactSuggestions(Array.isArray(d) ? d.slice(0, 5) : []))
        .catch(() => {});
    }, 200);
    return () => clearTimeout(t);
  }, [search]);

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchFocused(false);
        setShowAdvancedSearch(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const loadRecentSearches = () => {
    fetch(`${API_URL}/recent-searches`)
      .then(r => r.json())
      .then(d => setRecentSearches(Array.isArray(d) ? d : []))
      .catch(() => {});
  };

  const saveRecentSearch = (q) => {
    if (!q.trim()) return;
    // Optimistic update
    setRecentSearches(prev => [q.trim(), ...prev.filter(r => r !== q.trim())].slice(0, 8));
    fetch(`${API_URL}/recent-searches`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: q.trim() }),
    }).catch(() => {});
  };

  const removeRecentSearch = (q, e) => {
    e.stopPropagation();
    setRecentSearches(prev => prev.filter(r => r !== q));
    fetch(`${API_URL}/recent-searches/${encodeURIComponent(q)}`, { method: "DELETE" }).catch(() => {});
  };

  const commitSearch = (q) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    saveRecentSearch(trimmed);
    setSearch(trimmed);
    setDebouncedSearch(trimmed);
    setSearchPage(1);
    setSearchSelectedId(null);
    setSearchFocused(false);
    setShowAdvancedSearch(false);
    searchInputRef.current?.blur();
  };

  const commitAdvancedSearch = () => {
    const parts = [];
    if (advancedFields.from.trim())       parts.push(`from:${advancedFields.from.trim()}`);
    if (advancedFields.to.trim())         parts.push(`to:${advancedFields.to.trim()}`);
    if (advancedFields.subject.trim())    parts.push(`subject:${advancedFields.subject.trim()}`);
    if (advancedFields.hasWords.trim())   parts.push(advancedFields.hasWords.trim());
    if (advancedFields.noWords.trim())    parts.push(`-${advancedFields.noWords.trim()}`);
    if (advancedFields.hasAttachment)     parts.push("has:attachment");
    if (advancedFields.dateAfter.trim())  parts.push(`after:${advancedFields.dateAfter.trim()}`);
    if (advancedFields.dateBefore.trim()) parts.push(`before:${advancedFields.dateBefore.trim()}`);
    const q = parts.join(" ");
    if (q) commitSearch(q);
    setShowAdvancedSearch(false);
  };
  const [sidebarOpen, setSidebarOpen] = useState(
    () => localStorage.getItem("sidebarOpen") !== "false"
  );
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const isExpanded = sidebarOpen || sidebarHovered;

  // ── Email list via React Query ──────────────────────────────────────────────
  const { data: emailData, isLoading: folderLoading, isFetching: folderFetching } = useQuery({
    queryKey: emailListKey(activeNav, currentPage),
    queryFn: () => fetchEmailList(activeNav, currentPage),
    // Keep previous page's data visible while the next page loads
    placeholderData: (prev) => prev,
    staleTime: 60_000,        // consider fresh for 1 minute
    refetchInterval: 60_000,  // poll every 60 seconds for new messages
  });

  const isSearching = debouncedSearch.trim() !== "";

  // Backend search query — only fires when there is a search term
  const { data: searchData, isLoading: searchLoading } = useQuery({
    queryKey: ["search", debouncedSearch, searchPage],
    queryFn: () =>
      fetch(`${API_URL}/emails/search?q=${encodeURIComponent(debouncedSearch)}&page=${searchPage}`)
        .then((r) => r.json())
        .then((d) => (Array.isArray(d) ? { emails: d, total: d.length } : { emails: d.emails ?? [], total: d.total ?? 0 })),
    enabled: isSearching,
    placeholderData: (prev) => prev,
  });

  const emails = isSearching ? (searchData?.emails ?? []) : (emailData?.emails ?? []);
  const totalEmails = isSearching ? (searchData?.total ?? 0) : (emailData?.total ?? 0);
  const loading = isSearching ? searchLoading : folderLoading;
  // isFetching is true during both initial load AND background refetches (e.g. navigating to a
  // cached-but-stale page).  We must not trigger the empty-page redirect while a fresh response
  // is still in-flight — otherwise stale cached 0-email data causes an instant redirect before
  // the real server data arrives.
  const fetching = isSearching ? searchLoading : folderFetching;

  // Auto-navigate away from an empty page (e.g. after deleting all emails on a non-first page)
  useEffect(() => {
    // Wait until any in-flight fetch (initial or background) has settled before deciding the
    // page is truly empty.  With staleTime=60s, cached-empty data is returned immediately with
    // isFetching=false, so we also need to purge that stale entry so re-navigation forces a
    // fresh server fetch instead of re-triggering this redirect loop.
    if (isSearching || fetching) return;
    if (emails.length === 0) {
      if (currentPage > 1) {
        // Remove the empty page from cache entirely so the user can navigate back to it and
        // get a real server response rather than the stale 0-email entry.
        queryClient.removeQueries({ queryKey: emailListKey(activeNav, currentPage) });
        setAutoPageRedirecting(true);
        setCurrentPage((p) => p - 1);
      } else if (totalEmails > 0) {
        // Page 1 appears empty but server says emails exist — force a refetch
        queryClient.removeQueries({ queryKey: emailListKey(activeNav, 1) });
        setAutoPageRedirecting(true);
        queryClient.invalidateQueries({ queryKey: emailListKey(activeNav, 1) });
      }
    }
  }, [fetching, emails.length, currentPage, isSearching, totalEmails, activeNav]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clear the redirect flag once data actually arrives
  useEffect(() => {
    if (autoPageRedirecting && !fetching && emails.length > 0) {
      setAutoPageRedirecting(false);
    }
    // Also clear if we're genuinely on an empty folder (page 1, totalEmails 0)
    if (autoPageRedirecting && !fetching && currentPage === 1 && totalEmails === 0) {
      setAutoPageRedirecting(false);
    }
  }, [autoPageRedirecting, fetching, emails.length, currentPage, totalEmails]);

  // Always keep a live unread count for Inbox regardless of which folder is active
  // staleTime=5min so background refetches don't pile up IMAP connections
  const inboxData = useQuery({
    queryKey: emailListKey("Inbox", 1),
    queryFn: () => fetchEmailList("Inbox", 1),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
  const inboxUnreadCount = (inboxData.data?.emails ?? []).filter((e) => e.unread).length;

  // ── Browser notifications + WebSocket live updates ───────────────────────────

  // Request notification permission once on mount
  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // Refs so the WebSocket closure always sees the latest callbacks without
  // needing to re-create the socket on every render.
  const showToastRef = useRef(showToast);
  const setActiveNavRef = useRef(setActiveNav);
  const setSelectedIdRef = useRef(setSelectedId);
  useEffect(() => { showToastRef.current = showToast; }, [showToast]);
  useEffect(() => { setActiveNavRef.current = setActiveNav; }, [setActiveNav]);
  useEffect(() => { setSelectedIdRef.current = setSelectedId; }, [setSelectedId]);

  // WebSocket connection for real-time IMAP IDLE notifications
  useEffect(() => {
    // VITE_WS_URL is only needed in production (set to wss://your-backend.com).
    // In dev, Vite's proxy forwards WebSocket upgrades so we use the page host.
    const wsBase = import.meta.env.VITE_WS_URL ||
      (window.location.protocol === "https:" ? "wss:" : "ws:") + "//" + window.location.host;
    const wsUrl = wsBase.replace(/\/$/, "") + "/mail-events";
    let ws;
    let reconnectTimer;
    let destroyed = false;

    function handleNewEmails(newEmails) {
      if (!newEmails.length) return;

      // Force-refetch inbox so new emails appear instantly in the list
      queryClient.refetchQueries({ queryKey: ["emails", "Inbox", 1] });

      const first = newEmails[0];
      const label = newEmails.length === 1
        ? `New email from ${first.senderName || first.senderEmail}`
        : `${newEmails.length} new messages`;
      const body = newEmails.length === 1
        ? (first.subject || "(no subject)")
        : newEmails.map((e) => `${e.senderName || e.senderEmail}: ${e.subject || "(no subject)"}`).join("\n");

      // Browser desktop notification (works when app is in background)
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        const n = new Notification(label, {
          body,
          icon: "/YanaCorp-Logo-Blue.png",
          tag: newEmails.length === 1 ? `email-${first.id}` : "email-batch",
          // requireInteraction: true,
        });
        n.onclick = () => {
          if (window.electronAPI?.focusWindow) {
            window.electronAPI.focusWindow();
          } else {
            window.focus();
          }
          setActiveNavRef.current("Inbox");
          if (newEmails.length === 1) setSelectedIdRef.current(first.id);
          n.close();
        };
      }

      // In-app toast — always shown regardless of notification permission
      showToastRef.current(label, [
        {
          label: "View",
          onClick: () => {
            setActiveNavRef.current("Inbox");
            if (newEmails.length === 1) setSelectedIdRef.current(first.id);
          },
        },
      ]);
    }

    function connect() {
      if (destroyed) return;
      ws = new WebSocket(wsUrl);

      ws.onopen = () => console.log("[mail-events] WebSocket connected");
      ws.onmessage = (evt) => {
        console.log("[mail-events] message received:", evt.data);
        try {
          const msg = JSON.parse(evt.data);
          if (msg.type === "new_emails" && Array.isArray(msg.emails) && msg.emails.length > 0) {
            handleNewEmails(msg.emails);
          }
        } catch { /* ignore malformed frames */ }
      };

      ws.onclose = (evt) => {
        console.log(`[mail-events] WebSocket closed — code: ${evt.code}, reason: "${evt.reason}"`);
        if (!destroyed) reconnectTimer = setTimeout(connect, 5_000);
      };

      ws.onerror = (e) => { if (!destroyed) console.error("[mail-events] WebSocket error", e); ws.close(); };
    }

    connect();

    return () => {
      destroyed = true;
      clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const draftsData = useQuery({
    queryKey: emailListKey("Drafts", 1),
    queryFn: () => fetchEmailList("Drafts", 1),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
  const draftsCount = draftsData.data?.total ?? 0;

  const spamData = useQuery({
    queryKey: emailListKey("Spam", 1),
    queryFn: () => fetchEmailList("Spam", 1),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
  const spamCount = spamData.data?.total ?? 0;

  const { data: storageData } = useQuery({
    queryKey: ["storage"],
    queryFn: () => fetch(`${API_URL}/storage`).then((r) => r.json()),
    staleTime: 15 * 60_000,
  });
  const storageInfo = storageData?.percent != null ? storageData : null;

  // Sync URL hash whenever folder or open email changes
  useEffect(() => {
    const hash = selectedId ? `${activeNav}/${selectedId}` : activeNav;
    window.location.hash = hash;
  }, [activeNav, selectedId]);

  // Restore email list scroll position when going back from an email
  useEffect(() => {
    if (!selectedId && emailListRef.current) {
      emailListRef.current.scrollTop = savedScrollTop.current;
    }
  }, [selectedId]);

  // Reset scroll to top when switching folders
  useEffect(() => {
    savedScrollTop.current = 0;
    if (emailListRef.current) emailListRef.current.scrollTop = 0;
  }, [activeNav]);

  // Auto-open the most-recent Sent email after "View message" is clicked
  useEffect(() => {
    if (pendingOpenLatestSent.current && activeNav === "Sent" && emails.length > 0) {
      pendingOpenLatestSent.current = false;
      setSelectedId(emails[0].id);
    }
  }, [emails, activeNav]);

  // Helper: patch list cache in-place (for optimistic updates)
  const patchList = (updater) => {
    if (isSearching) {
      queryClient.setQueryData(["search", debouncedSearch, searchPage], (old) =>
        old ? { ...old, emails: updater(old.emails) } : old,
      );
    }
    queryClient.setQueryData(emailListKey(activeNav, currentPage), (old) =>
      old ? { ...old, emails: updater(old.emails) } : old,
    );
  };

  // Prefetch email detail on hover so it's ready before you click
  const prefetchDetail = (id) => {
    const folder = activeNav === "Sent" ? "sent" : activeNav === "Drafts" ? "drafts" : activeNav === "Trash" ? "trash" : activeNav === "Spam" ? "spam" : "inbox";
    const param  = folder === "sent" ? "?folder=sent" : folder === "drafts" ? "?folder=drafts" : folder === "trash" ? "?folder=trash" : folder === "spam" ? "?folder=spam" : "";
    queryClient.prefetchQuery({
      queryKey: ["email", id, folder],
      queryFn: () => fetch(`${API_URL}/emails/${id}${param}`).then((r) => r.json()),
      staleTime: Infinity,
    });
  };

  // If the email isn't in the current page (e.g. restored from URL after refresh),
  // create a minimal stub so EmailDetail can still fetch and display it.
  const selectedEmail =
    emails.find((e) => e.id === selectedId) ||
    (selectedId
      ? { id: selectedId, label: activeNav === "Sent" ? "sent" : activeNav === "Spam" ? "spam" : "inbox" }
      : null);

  const toggleStar = (id, e) => {
    e.stopPropagation();
    patchList((list) =>
      list.map((em) => {
        if (em.id !== id) return em;
        const nowStarred = !em.starred;
        fetch(`${API_URL}/emails/${id}/${nowStarred ? "star" : "unstar"}`, { method: "POST" }).catch(() => {});
        // In the Starred folder, unstarring should remove the row
        if (activeNav === "Starred" && !nowStarred) return null;
        return { ...em, starred: nowStarred };
      }).filter(Boolean),
    );
  };

  const openEmail = (id) => {
    if (checkedIds.size > 0) {
      toggleCheck(id);
      return;
    }

    // Drafts open in ComposeModal pre-filled, not in the detail view
    if (activeNav === "Drafts") {
      fetch(`${API_URL}/emails/${id}?folder=drafts`)
        .then((r) => r.json())
        .then((detail) => {
          const toAddresses = detail.toEmail
            ? [{ name: detail.toName || detail.toEmail, email: detail.toEmail }]
            : [];
          setComposeDraft({
            recipients:  toAddresses,
            subject:     detail.subject || "",
            body:        detail.html || detail.text || "",
            attachments: [],
            draftUid:    id,   // so executeSend can delete this draft after sending
          });
          setComposeKey((k) => k + 1);
          setShowCompose(true);
          setComposeMinimized(false);
        })
        .catch(() => {});
      return;
    }

    // Save scroll position before opening so we can restore it on back
    savedScrollTop.current = emailListRef.current?.scrollTop ?? 0;
    setSelectedId(id);
    patchList((list) =>
      list.map((em) => {
        if (em.id !== id) return em;
        if (em.unread) {
          const fp = activeNav === "Sent" ? "?folder=sent" : activeNav === "Drafts" ? "?folder=drafts" : activeNav === "Trash" ? "?folder=trash" : activeNav === "Spam" ? "?folder=spam" : "";
          fetch(`${API_URL}/emails/${id}/mark-read${fp}`, { method: "POST" }).catch(() => {});
        }
        return { ...em, unread: false };
      }),
    );
  };

  const toggleCheck = (id, e) => {
    if (e) e.stopPropagation();
    setCheckedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filteredEmails = emails;

  const activePage = isSearching ? searchPage : currentPage;
  const setActivePage = isSearching ? setSearchPage : setCurrentPage;
  const totalPages = Math.ceil(totalEmails / PAGE_SIZE) || 1;
  const paginatedEmails = filteredEmails;
  const pageStart = totalEmails === 0 ? 0 : (activePage - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(activePage * PAGE_SIZE, totalEmails);

  const allChecked =
    filteredEmails.length > 0 &&
    filteredEmails.every((e) => checkedIds.has(e.id));
  const someChecked = checkedIds.size > 0;

  const toggleSelectAll = () =>
    allChecked
      ? setCheckedIds(new Set())
      : setCheckedIds(new Set(filteredEmails.map((e) => e.id)));

  const folderQS = activeNav === "Sent" ? "?folder=sent" : activeNav === "Drafts" ? "?folder=drafts" : activeNav === "Trash" ? "?folder=trash" : activeNav === "Spam" ? "?folder=spam" : "";

  const markCheckedRead = () => {
    const ids = [...checkedIds];
    const count = ids.length;
    patchList((list) =>
      list.map((em) => (checkedIds.has(em.id) ? { ...em, unread: false } : em)),
    );
    setCheckedIds(new Set());
    showToast(`${count} conversation${count !== 1 ? "s" : ""} marked as read.`, {
      label: "Undo",
      onClick: () => {
        patchList((list) => list.map((em) => (ids.includes(em.id) ? { ...em, unread: true } : em)));
        ids.forEach((id) => fetch(`${API_URL}/emails/${id}/mark-unread${folderQS}`, { method: "POST" }).catch(() => {}));
        showToast("Action undone.");
      },
    });
    ids.forEach((id) =>
      fetch(`${API_URL}/emails/${id}/mark-read${folderQS}`, { method: "POST" }).catch(() => {}),
    );
  };

  const markCheckedUnread = () => {
    const ids = [...checkedIds];
    const count = ids.length;
    patchList((list) =>
      list.map((em) => (checkedIds.has(em.id) ? { ...em, unread: true } : em)),
    );
    setCheckedIds(new Set());
    showToast(`${count} conversation${count !== 1 ? "s" : ""} marked as unread.`, {
      label: "Undo",
      onClick: () => {
        patchList((list) => list.map((em) => (ids.includes(em.id) ? { ...em, unread: false } : em)));
        ids.forEach((id) => fetch(`${API_URL}/emails/${id}/mark-read${folderQS}`, { method: "POST" }).catch(() => {}));
        showToast("Action undone.");
      },
    });
    ids.forEach((id) =>
      fetch(`${API_URL}/emails/${id}/mark-unread${folderQS}`, { method: "POST" }).catch(() => {}),
    );
  };

  const archiveChecked = () => {
    const ids = [...checkedIds];
    const count = ids.length;
    const snapshot = emails.filter((em) => checkedIds.has(em.id));
    patchList((list) => list.filter((em) => !checkedIds.has(em.id)));
    setCheckedIds(new Set());
    showToast(`${count} conversation${count !== 1 ? "s" : ""} archived.`, {
      label: "Undo",
      onClick: () => {
        patchList((list) => [...snapshot, ...list]);
        ids.forEach((id) => fetch(`${API_URL}/emails/${id}/restore`, { method: "POST" }).catch(() => {}));
        showToast("Action undone.");
      },
    });
    ids.forEach((id) =>
      fetch(`${API_URL}/emails/${id}/archive${folderQS}`, { method: "POST" }).catch(() => {}),
    );
  };

  const deleteChecked = () => {
    const ids = [...checkedIds];
    const count = ids.length;
    const snapshot = emails.filter((em) => checkedIds.has(em.id));
    patchList((list) => list.filter((em) => !checkedIds.has(em.id)));
    setCheckedIds(new Set());
    showToast(`${count} conversation${count !== 1 ? "s" : ""} moved to Trash.`, {
      label: "Undo",
      onClick: () => {
        patchList((list) => [...snapshot, ...list]);
        ids.forEach((id) => fetch(`${API_URL}/emails/${id}/restore`, { method: "POST" }).catch(() => {}));
        showToast("Action undone.");
      },
    });
    ids.forEach((id) =>
      fetch(`${API_URL}/emails/${id}/trash${folderQS}`, { method: "POST" }).catch(() => {}),
    );
  };

  const deleteForeverChecked = () => {
    const ids = [...checkedIds];
    const count = ids.length;
    patchList((list) => list.filter((em) => !checkedIds.has(em.id)));
    setCheckedIds(new Set());
    showToast(`${count} conversation${count !== 1 ? "s" : ""} permanently deleted.`);
    ids.forEach((id) =>
      fetch(`${API_URL}/emails/${id}/delete-forever`, { method: "POST" }).catch(() => {}),
    );
  };

  const restoreChecked = () => {
    const ids = [...checkedIds];
    const count = ids.length;
    patchList((list) => list.filter((em) => !checkedIds.has(em.id)));
    setCheckedIds(new Set());
    showToast(`${count} conversation${count !== 1 ? "s" : ""} restored to Inbox.`);
    ids.forEach((id) =>
      fetch(`${API_URL}/emails/${id}/restore`, { method: "POST" }).catch(() => {}),
    );
  };

  const refreshEmails = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({
      queryKey: emailListKey(activeNav, currentPage),
    });
    setRefreshing(false);
  };

  const markAllRead = () => {
    patchList((list) => list.map((em) => ({ ...em, unread: false })));
    setShowMoreMenu(false);
  };

  // ── Snooze helpers ────────────────────────────────────────────────────────
  const getSnoozeOptions = () => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const fmt = (d) => {
      const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
      const isToday = d.toDateString() === now.toDateString();
      const isTomorrow = d.toDateString() === new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toDateString();
      const label = isToday ? "Today" : isTomorrow ? "Tomorrow" : days[d.getDay()];
      return `${label}, ${pad(d.getHours())}:${pad(d.getMinutes())} ${d.getHours() < 12 ? "AM" : "PM"}`;
    };

    const laterToday = new Date(now);
    laterToday.setHours(now.getHours() + 3, 0, 0, 0);

    const tomorrowMorning = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 8, 0, 0, 0);

    const daysUntilSat = (6 - now.getDay() + 7) % 7 || 7;
    const thisWeekend  = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilSat, 8, 0, 0, 0);

    const daysUntilMon = (1 - now.getDay() + 7) % 7 || 7;
    const nextWeek     = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilMon, 8, 0, 0, 0);

    const opts = [
      { label: "Later today",       time: laterToday,     display: fmt(laterToday)     },
      { label: "Tomorrow morning",  time: tomorrowMorning,display: fmt(tomorrowMorning) },
    ];
    if (thisWeekend > tomorrowMorning) {
      opts.push({ label: "This weekend", time: thisWeekend, display: fmt(thisWeekend) });
    }
    opts.push({ label: "Next week", time: nextWeek, display: fmt(nextWeek) });
    return opts;
  };

  const confirmSnooze = async (snoozeUntil) => {
    if (!snoozeTarget) return;
    const folder = snoozeTarget.folder || (activeNav === "Sent" ? "sent" : activeNav === "Drafts" ? "drafts" : "inbox");
    await fetch(`${API_URL}/emails/${snoozeTarget.id}/snooze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ snooze_until: snoozeUntil.toISOString(), folder }),
    }).catch(() => {});
    patchList((list) => list.filter((em) => em.id !== snoozeTarget.id));
    setSnoozeTarget(null);
  };

  const confirmUnsubscribe = async () => {
    if (!unsubscribeTarget) return;
    setUnsubscribing(true);
    try {
      await fetch(`${API_URL}/emails/${unsubscribeTarget.id}/unsubscribe`, {
        method: "POST",
      });
      patchList((list) => list.filter((em) => em.id !== unsubscribeTarget.id));
    } catch (err) {
      console.error("Unsubscribe failed:", err);
    } finally {
      setUnsubscribing(false);
      setUnsubscribeTarget(null);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        fontFamily: "'Google Sans', 'Segoe UI', sans-serif",
        background: "#f6f8fc",
        overflow: "hidden",
      }}
    >
      {/* ── TOP BAR (hamburger + logo + search + avatar) ── always full width, never moves */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
        }}
      >
      {/* Loading bar — shown on refresh (loading) and background page fetches (fetching) */}
      <div style={{ height: 3, background: "transparent", overflow: "hidden", flexShrink: 0 }}>
        {fetching && (
          <>
            <style>{`
              @keyframes gmail-loading {
                0%   { transform: translateX(-100%); }
                50%  { transform: translateX(0%); }
                100% { transform: translateX(100%); }
              }
              div:has(> .pane-resize-line):hover .pane-resize-line {
                width: 2px !important;
              }
            `}</style>
            <div style={{
              height: "100%",
              background: "#1a73e8",
              animation: "gmail-loading 1.4s ease-in-out infinite",
              width: "40%",
            }} />
          </>
        )}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 16px 8px 4px",
          background: "#f6f8fc",
          flexShrink: 0,
          height: 61,
        }}
      >
        {/* Hamburger */}
        <button
          onClick={() => {
            setSidebarOpen((o) => {
              const next = !o;
              localStorage.setItem("sidebarOpen", next);
              return next;
            });
            setSidebarHovered(false);
          }}
          title="Main menu"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            width: 48,
            height: 48,
            borderRadius: "50%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
            flexShrink: 0,
            transition: "background 0.1s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#e0e0e0")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
        >
          <MdMenu size={22} color="#5f6368" />
        </button>

        {/* Gmail icon */}
        <img src={`${import.meta.env.BASE_URL}gmail.png`} alt="Gmail" width={28} height={28} style={{ flexShrink: 0 }} />

        {/* Gmail logo */}
        <span
          onClick={() => {
            setActiveNav("Inbox");
            setSelectedId(null);
            setCurrentPage(1);
          }}
          style={{
            fontSize: 22,
            fontWeight: 400,
            letterSpacing: "-0.5px",
            whiteSpace: "nowrap",
            marginRight: 16,
            userSelect: "none",
            cursor: "pointer",
          }}
        >
          <span style={{ color: "#5f6368" }}>Yanamail</span>
        </span>

        {/* Search bar */}
        <div
          ref={searchRef}
          style={{
            flex: 1,
            maxWidth: 720,
            position: "relative",
            marginLeft: 90,
          }}
        >
          {/* Input row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: searchFocused ? "#fff" : "#eaf1fb",
              borderRadius: searchFocused && (search || recentSearches.length > 0 || showAdvancedSearch) ? "24px 24px 0 0" : 24,
              padding: "8px 8px 8px 16px",
              gap: 8,
              boxShadow: searchFocused ? "0 1px 3px rgba(0,0,0,0.15)" : "none",
              transition: "background 0.15s, box-shadow 0.15s",
            }}
          >
            <MdSearch
              size={20}
              color={searchFocused ? "#1a73e8" : "#5f6368"}
              style={{ flexShrink: 0, cursor: "pointer" }}
              onClick={() => search.trim() && commitSearch(search)}
            />
            <input
              ref={searchInputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => { setSearchFocused(true); setShowAdvancedSearch(false); loadRecentSearches(); }}
              onKeyDown={(e) => {
                if (e.key === "Enter") { commitSearch(search); }
                else if (e.key === "Escape") {
                  if (showAdvancedSearch) { setShowAdvancedSearch(false); return; }
                  setSearch(""); setDebouncedSearch(""); setSearchPage(1); setSearchSelectedId(null); setSearchFocused(false);
                }
              }}
              placeholder="Search mail"
              style={{
                border: "none",
                background: "transparent",
                outline: "none",
                fontSize: 16,
                color: "#202124",
                width: "100%",
                fontFamily: "inherit",
              }}
            />
            {search && (
              <button
                onClick={() => { setSearch(""); setDebouncedSearch(""); setSearchPage(1); setSearchSelectedId(null); searchInputRef.current?.focus(); }}
                style={{ background: "none", border: "none", cursor: "pointer", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", color: "#5f6368", flexShrink: 0 }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f3f4")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              >
                <MdClose size={18} />
              </button>
            )}
            {/* Advanced search toggle */}
            <Tooltip label="Show search options" position="bottom">
              <button
                onClick={(e) => { e.stopPropagation(); setShowAdvancedSearch(v => !v); setSearchFocused(true); }}
                style={{ background: "none", border: "none", cursor: "pointer", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", color: "#5f6368", flexShrink: 0 }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f3f4")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              >
                <MdTune size={20} />
              </button>
            </Tooltip>
          </div>

          {/* Suggestions dropdown — only render when there is content to show */}
          {searchFocused && !showAdvancedSearch && (search.trim() || recentSearches.length > 0) && (
            <div style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              background: "#fff",
              borderRadius: "0 0 24px 24px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              zIndex: 2000,
              overflow: "hidden",
              paddingBottom: 8,
            }}>
              {/* Recent searches (when input is empty) */}
              {!search.trim() && recentSearches.length > 0 && (
                <>
                  <div style={{ padding: "10px 20px 4px", fontSize: 12, color: "#5f6368", fontWeight: 500, letterSpacing: 0.3 }}>
                    RECENT SEARCHES
                  </div>
                  {recentSearches.map((r) => (
                    <div
                      key={r}
                      onClick={() => commitSearch(r)}
                      style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 16px", cursor: "pointer", userSelect: "none" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f3f4")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <MdSearch size={18} color="#5f6368" style={{ flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 14, color: "#202124" }}>{r}</span>
                      <button
                        onClick={(e) => removeRecentSearch(r, e)}
                        style={{ background: "none", border: "none", cursor: "pointer", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", color: "#5f6368" }}
                        onMouseEnter={(e) => { e.stopPropagation(); e.currentTarget.style.background = "#e0e0e0"; }}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                        title="Remove"
                      >
                        <MdClose size={16} />
                      </button>
                    </div>
                  ))}
                </>
              )}

              {/* Typing — show suggestions */}
              {search.trim() && (
                <>
                  {/* Search this query */}
                  <div
                    onClick={() => commitSearch(search)}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", cursor: "pointer" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f3f4")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <MdSearch size={18} color="#1a73e8" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 14, color: "#202124" }}>Search for <b>{search}</b></span>
                  </div>

                  {/* Filter shortcuts */}
                  {[
                    { label: `From: ${search}`, query: `from:${search}`, icon: "👤" },
                    { label: `Subject: ${search}`, query: `subject:${search}`, icon: "📋" },
                    { label: `Has attachment + ${search}`, query: `${search} has:attachment`, icon: "📎" },
                  ].map(({ label, query, icon }) => (
                    <div
                      key={query}
                      onClick={() => commitSearch(query)}
                      style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 16px", cursor: "pointer" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f3f4")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <span style={{ width: 18, textAlign: "center", fontSize: 14, flexShrink: 0 }}>{icon}</span>
                      <span style={{ fontSize: 14, color: "#5f6368" }}>{label}</span>
                    </div>
                  ))}

                  {/* Contact suggestions */}
                  {contactSuggestions.length > 0 && (
                    <>
                      <div style={{ height: 1, background: "#f1f3f4", margin: "4px 16px" }} />
                      <div style={{ padding: "6px 20px 4px", fontSize: 12, color: "#5f6368", fontWeight: 500, letterSpacing: 0.3 }}>
                        PEOPLE
                      </div>
                      {contactSuggestions.map((c) => (
                        <div
                          key={c.email}
                          onClick={() => commitSearch(`from:${c.email}`)}
                          style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 16px", cursor: "pointer" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f3f4")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#1a73e8", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
                            {(c.name || c.email)[0].toUpperCase()}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 14, color: "#202124", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name || c.email}</div>
                            <div style={{ fontSize: 12, color: "#5f6368", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.email}</div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </>
              )}


              {/* Footer */}
              <div style={{ borderTop: "1px solid #f1f3f4", margin: "6px 0 0", padding: "8px 16px 4px", display: "flex", gap: 8, flexWrap: "wrap" }}>
                {["has:attachment", "is:unread", "is:starred", "label:inbox"].map((chip) => (
                  <button
                    key={chip}
                    onClick={() => commitSearch(chip)}
                    style={{ fontSize: 12, padding: "4px 12px", borderRadius: 14, border: "1px solid #dadce0", background: "#fff", color: "#202124", cursor: "pointer", fontFamily: "inherit" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f3f4")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Advanced search panel */}
          {showAdvancedSearch && (
            <div style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              background: "#fff",
              borderRadius: "0 0 16px 16px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
              zIndex: 2000,
              padding: "16px 20px 20px",
            }}>
              <div style={{ fontSize: 13, color: "#5f6368", fontWeight: 600, marginBottom: 14, letterSpacing: 0.3 }}>ADVANCED SEARCH</div>
              {[
                { label: "From", key: "from", placeholder: "e.g. john@example.com" },
                { label: "To", key: "to", placeholder: "e.g. me@example.com" },
                { label: "Subject", key: "subject", placeholder: "Words in the subject" },
                { label: "Has words", key: "hasWords", placeholder: "Words in the message" },
                { label: "Doesn't have", key: "noWords", placeholder: "Words to exclude" },
              ].map(({ label, key, placeholder }) => (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                  <label style={{ width: 100, fontSize: 13, color: "#5f6368", textAlign: "right", flexShrink: 0 }}>{label}</label>
                  <input
                    value={advancedFields[key]}
                    onChange={(e) => setAdvancedFields(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    style={{ flex: 1, border: "1px solid #dadce0", borderRadius: 4, padding: "6px 10px", fontSize: 14, outline: "none", fontFamily: "inherit" }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "#1a73e8")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "#dadce0")}
                    onKeyDown={(e) => { if (e.key === "Enter") commitAdvancedSearch(); }}
                  />
                </div>
              ))}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <label style={{ width: 100, fontSize: 13, color: "#5f6368", textAlign: "right", flexShrink: 0 }}>Date after</label>
                <input type="date" value={advancedFields.dateAfter} onChange={(e) => setAdvancedFields(f => ({ ...f, dateAfter: e.target.value }))}
                  style={{ flex: 1, border: "1px solid #dadce0", borderRadius: 4, padding: "6px 10px", fontSize: 14, outline: "none", fontFamily: "inherit" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#1a73e8")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#dadce0")} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <label style={{ width: 100, fontSize: 13, color: "#5f6368", textAlign: "right", flexShrink: 0 }}>Date before</label>
                <input type="date" value={advancedFields.dateBefore} onChange={(e) => setAdvancedFields(f => ({ ...f, dateBefore: e.target.value }))}
                  style={{ flex: 1, border: "1px solid #dadce0", borderRadius: 4, padding: "6px 10px", fontSize: 14, outline: "none", fontFamily: "inherit" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#1a73e8")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#dadce0")} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <label style={{ width: 100, fontSize: 13, color: "#5f6368", textAlign: "right", flexShrink: 0 }}>Has</label>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, color: "#202124", cursor: "pointer" }}>
                  <input type="checkbox" checked={advancedFields.hasAttachment} onChange={(e) => setAdvancedFields(f => ({ ...f, hasAttachment: e.target.checked }))}
                    style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#1a73e8" }} />
                  Attachment
                </label>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button onClick={() => { setShowAdvancedSearch(false); setAdvancedFields({ from: "", to: "", subject: "", hasWords: "", noWords: "", hasAttachment: false, dateAfter: "", dateBefore: "" }); }}
                  style={{ padding: "8px 20px", borderRadius: 4, border: "1px solid #dadce0", background: "#fff", fontSize: 14, cursor: "pointer", color: "#202124", fontFamily: "inherit" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f3f4")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}>
                  Cancel
                </button>
                <button onClick={commitAdvancedSearch}
                  style={{ padding: "8px 20px", borderRadius: 4, border: "none", background: "#1a73e8", color: "#fff", fontSize: 14, cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#1765cc")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#1a73e8")}>
                  Search
                </button>
              </div>
            </div>
          )}
        </div>

        <div style={{ flex: 1 }} />

        {/* Help / Support */}
        <Tooltip label="Help" position="bottom">
          <button
            ref={helpBtnRef}
            onClick={() => setShowHelpMenu(v => !v)}
            style={{ background: showHelpMenu ? "#e0e0e0" : "none", border: "none", cursor: "pointer", borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", color: "#5f6368", flexShrink: 0 }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#e0e0e0")}
            onMouseLeave={(e) => (e.currentTarget.style.background = showHelpMenu ? "#e0e0e0" : "none")}
          >
            <MdHelpOutline size={22} />
          </button>
        </Tooltip>

        {/* Settings */}
        <Tooltip label="Settings" position="bottom">
          <button
            onClick={() => setShowSettingsModal(true)}
            style={{ background: "none", border: "none", cursor: "pointer", borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", color: "#5f6368", flexShrink: 0 }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#e0e0e0")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            <MdSettings size={22} />
          </button>
        </Tooltip>

        {/* Avatar + account menu */}
        <AvatarMenu userEmail={userEmail} onLogout={onLogout} />
      </div>
      </div>

      {/* ── BODY ROW (sidebar + main) ── */}
      <div
        style={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Sidebar nav — always absolute when collapsed so main content never moves */}
        <div
          onMouseEnter={() => {
            if (!sidebarOpen) setSidebarHovered(true);
          }}
          onMouseLeave={() => setSidebarHovered(false)}
          style={{
            width: isExpanded ? 256 : 72,
            background: "#f6f8fc",
            display: "flex",
            flexDirection: "column",
            padding: "4px 0 8px",
            flexShrink: 0,
            transition: "width 0.2s cubic-bezier(0.4,0,0.2,1)",
            overflow: "hidden",
            ...(!sidebarOpen
              ? {
                  position: "absolute",
                  top: 0,
                  left: 0,
                  bottom: 0,
                  zIndex: 20,
                  boxShadow: isExpanded
                    ? "4px 0 16px rgba(0,0,0,0.14)"
                    : "none",
                }
              : {
                  position: "relative",
                }),
          }}
        >
          {/* Compose */}
          <div style={{ padding: "8px 12px 12px" }}>
            <button
              onClick={() => {
                setShowCompose(true);
                setComposeMinimized(false);
              }}
              title="Compose"
              style={{
                width: isExpanded ? "100%" : 48,
                padding: isExpanded ? "14px 20px" : "14px 0",
                background: "#c2e7ff",
                border: "none",
                borderRadius: 20,
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: isExpanded ? "flex-start" : "center",
                gap: isExpanded ? 12 : 0,
                color: "#001d35",
                transition:
                  "width 0.2s cubic-bezier(0.4,0,0.2,1), padding 0.2s",
                overflow: "hidden",
                whiteSpace: "nowrap",
              }}
            >
              <MdEdit size={20} style={{ flexShrink: 0 }} />
              <span
                style={{
                  opacity: isExpanded ? 1 : 0,
                  maxWidth: isExpanded ? "none" : 0,
                  transition: "opacity 0.1s, max-width 0.2s cubic-bezier(0.4,0,0.2,1)",
                  overflow: "hidden",
                }}
              >
                Compose
              </span>
            </button>
          </div>

          {/* Nav items */}
          {NAV_ITEMS.map((item) => (
            <div
              key={item.label}
              onClick={() => {
                setActiveNav(item.label);
                setCurrentPage(1);
                setSelectedId(null);
              }}
              title={!isExpanded ? item.label : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "7px 16px 7px 26px",
                justifyContent: "flex-start",
                fontSize: 14,
                cursor: "pointer",
                borderRadius: "0 20px 20px 0",
                marginRight: isExpanded ? 16 : 8,
                marginLeft: 0,
                background:
                  activeNav === item.label ? "#c2e7ff" : "transparent",
                color: activeNav === item.label ? "#001d35" : "#202124",
                fontWeight: activeNav === item.label ? 600 : 400,
                transition: "background 0.1s, margin 0.2s",
                whiteSpace: "nowrap",
                position: "relative",
              }}
            >
              {/* Icon with dot anchored just outside its top-right corner */}
              <span style={{ position: "relative", flexShrink: 0, display: "flex", overflow: "visible" }}>
                <item.icon size={20} />
                {!isExpanded && item.label === "Inbox" && inboxUnreadCount > 0 && (
                  <span style={{
                    position: "absolute",
                    top: -5,
                    right: -11,
                    background: "#1a73e8",
                    borderRadius: "50%",
                    width: 8,
                    height: 8,
                    border: "2px solid #f6f8fc",
                  }} />
                )}
                {!isExpanded && item.label === "Drafts" && draftsCount > 0 && (
                  <span style={{
                    position: "absolute",
                    top: -5,
                    right: -11,
                    background: "#c5221f",
                    borderRadius: "50%",
                    width: 8,
                    height: 8,
                    border: "2px solid #f6f8fc",
                  }} />
                )}
              </span>
              <span
                style={{
                  flex: 1,
                  opacity: isExpanded ? 1 : 0,
                  transition: "opacity 0.1s",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {item.label}
              </span>
              {/* Expanded counts */}
              {item.label === "Inbox" && inboxUnreadCount > 0 && isExpanded && (
                <span style={{ fontSize: 12, fontWeight: 600, color: activeNav === item.label ? "#001d35" : "#202124" }}>
                  {inboxUnreadCount}
                </span>
              )}
              {item.label === "Drafts" && draftsCount > 0 && isExpanded && (
                <span style={{ fontSize: 12, fontWeight: 600, color: activeNav === item.label ? "#001d35" : "#c5221f" }}>
                  {draftsCount}
                </span>
              )}
            </div>
          ))}

          {/* More / Less toggle — always at the same position, right after primary nav */}
          <div
            onClick={() => setShowMoreNav(v => !v)}
            title={!isExpanded ? (showMoreNav ? "Less" : "More") : undefined}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "7px 16px 7px 26px",
              fontSize: 14,
              cursor: "pointer",
              borderRadius: "0 20px 20px 0",
              marginRight: isExpanded ? 16 : 8,
              marginLeft: 0,
              color: "#202124",
              transition: "background 0.1s, margin 0.2s",
              overflow: "hidden",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#f1f3f4"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            {showMoreNav
              ? <MdKeyboardArrowUp size={20} style={{ flexShrink: 0 }} />
              : <MdKeyboardArrowDown size={20} style={{ flexShrink: 0 }} />
            }
            <span style={{ opacity: isExpanded ? 1 : 0, transition: "opacity 0.1s" }}>
              {showMoreNav ? "Less" : "More"}
            </span>
          </div>

          {/* Spam & Trash — revealed below the toggle when expanded */}
          {showMoreNav && NAV_ITEMS_MORE.map((item) => (
            <div
              key={item.label}
              onClick={() => {
                setActiveNav(item.label);
                setCurrentPage(1);
                setSelectedId(null);
              }}
              title={!isExpanded ? item.label : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "7px 16px 7px 26px",
                fontSize: 14,
                cursor: "pointer",
                borderRadius: "0 20px 20px 0",
                marginRight: isExpanded ? 16 : 8,
                marginLeft: 0,
                background: activeNav === item.label ? "#c2e7ff" : "transparent",
                color: activeNav === item.label ? "#001d35" : "#202124",
                fontWeight: activeNav === item.label ? 600 : 400,
                transition: "background 0.1s, margin 0.2s",
                whiteSpace: "nowrap",
                position: "relative",
              }}
            >
              {/* Icon with optional dot */}
              <span style={{ position: "relative", flexShrink: 0, display: "flex", overflow: "visible" }}>
                <item.icon size={20} />
                {!isExpanded && item.label === "Spam" && spamCount > 0 && (
                  <span style={{
                    position: "absolute",
                    top: -5,
                    right: -11,
                    background: "#c5221f",
                    borderRadius: "50%",
                    width: 8,
                    height: 8,
                    border: "2px solid #f6f8fc",
                  }} />
                )}
              </span>
              <span style={{ flex: 1, opacity: isExpanded ? 1 : 0, transition: "opacity 0.1s", overflow: "hidden", textOverflow: "ellipsis" }}>
                {item.label}
              </span>
              {/* Expanded count */}
              {item.label === "Spam" && spamCount > 0 && isExpanded && (
                <span style={{ fontSize: 12, fontWeight: 600, color: activeNav === item.label ? "#001d35" : "#c5221f" }}>
                  {spamCount}
                </span>
              )}
            </div>
          ))}

          {/* Labels */}
          <div
            style={{
              marginTop: 12,
              paddingTop: 12,
              borderTop: "0.5px solid #e0e0e0",
              overflow: "hidden",
            }}
          >
            {isExpanded ? (
              <div style={{ display: "flex", alignItems: "center", padding: "4px 8px 4px 20px" }}>
                <span style={{ flex: 1, fontSize: 12, color: "#5f6368", fontWeight: 700, letterSpacing: "0.3px" }}>
                  Labels
                </span>
                <Tooltip label="Create new label" position="bottom">
                  <button
                    style={{ background: "none", border: "none", cursor: "pointer", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", color: "#5f6368", flexShrink: 0, padding: 0 }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#e0e0e0")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                  >
                    <MdAdd size={18} />
                  </button>
                </Tooltip>
              </div>
            ) : (
              <Tooltip label="Create new label" position="right">
                <div
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 72, height: 36, cursor: "pointer", color: "#5f6368", borderRadius: "0 20px 20px 0", marginRight: 8 }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#e0e0e0")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <MdAdd size={20} />
                </div>
              </Tooltip>
            )}
            {Object.entries(LABEL_STYLES).map(([label, style]) => (
              <div
                key={label}
                title={!isExpanded ? label : undefined}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "6px 16px 6px 26px",
                  justifyContent: "flex-start",
                  fontSize: 14,
                  cursor: "pointer",
                  borderRadius: "0 20px 20px 0",
                  marginRight: isExpanded ? 16 : 8,
                  marginLeft: 0,
                  color: "#202124",
                  transition: "margin 0.2s",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                }}
              >
                <MdLabel
                  size={18}
                  style={{ color: style.color, flexShrink: 0 }}
                />
                <span
                  style={{
                    opacity: isExpanded ? 1 : 0,
                    transition: "opacity 0.1s",
                  }}
                >
                  {label.charAt(0).toUpperCase() + label.slice(1)}
                </span>
              </div>
            ))}
          </div>

        </div>

        {/* Fixed spacer when collapsed — main content never moves regardless of hover */}
        {!sidebarOpen && (
          <div style={{ width: 72, flexShrink: 0, flexGrow: 0 }} />
        )}

        {/* ── SEARCH RESULTS (replaces main content when searching) ── */}
        {isSearching && (
          <SearchOverlay
            query={debouncedSearch}
            page={searchPage}
            setPage={setSearchPage}
            emails={emails}
            totalEmails={totalEmails}
            loading={loading}
            selectedId={searchSelectedId}
            setSelectedId={setSearchSelectedId}
            onClose={() => { setSearch(""); setDebouncedSearch(""); setSearchPage(1); setSearchSelectedId(null); }}
            showToast={showToast}
            patchList={patchList}
            queryClient={queryClient}
          />
        )}

        {/* ── MAIN CONTENT ── */}
        {!isSearching && <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            background: "#fff",
            borderRadius: "16px 16px 0 0",
            overflow: "hidden",
            margin: "0 0 0 0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            minWidth: 0,
          }}
        >
          {/* Content */}
          <div style={{ flex: 1, display: "flex", overflow: "hidden", userSelect: isPaneDragging ? "none" : "auto" }}>
            {/* Email list — always visible in reading pane; shown when no email in normal mode */}
            {(!selectedEmail || readingPane) && (
                <div
                  style={{
                    flex: readingPane ? `0 0 ${listPaneWidth}px` : 1,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                  }}
                >
                  {/* Toolbar */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "4px 16px",
                      gap: 4,
                      borderBottom: "0.5px solid #e0e0e0",
                      minHeight: 40,
                      background: someChecked ? "#e8f0fe" : "transparent",
                      transition: "background 0.15s",
                    }}
                  >
                    {/* Select-all checkbox + dropdown caret */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        position: "relative",
                        flexShrink: 0,
                      }}
                    >
                      {/* Checkbox */}
                      <div
                        onClick={toggleSelectAll}
                        style={{
                          width: 14,
                          height: 14,
                          border: `1.5px solid ${allChecked ? "#1a73e8" : someChecked ? "#1a73e8" : "#5f6368"}`,
                          borderRadius: 2,
                          background: allChecked ? "#1a73e8" : "transparent",
                          cursor: "pointer",
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          position: "relative",
                        }}
                      >
                        {allChecked && (
                          <span
                            style={{
                              color: "#fff",
                              fontSize: 9,
                              lineHeight: 1,
                            }}
                          >
                            ✓
                          </span>
                        )}
                        {!allChecked && someChecked && (
                          <span
                            style={{
                              color: "#1a73e8",
                              fontSize: 11,
                              lineHeight: 1,
                              position: "absolute",
                            }}
                          >
                            —
                          </span>
                        )}
                      </div>

                      {/* Dropdown caret */}
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowSelectDropdown((v) => !v);
                        }}
                        style={{
                          width: 16,
                          height: 18,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          color: "#5f6368",
                          userSelect: "none",
                        }}
                      >
                        <MdArrowDropDown size={18} />
                      </div>

                      {/* Dropdown menu */}
                      {showSelectDropdown && (
                        <>
                          {/* Backdrop to close */}
                          <div
                            onClick={() => setShowSelectDropdown(false)}
                            style={{ position: "fixed", inset: 0, zIndex: 99 }}
                          />
                          <div
                            style={{
                              position: "absolute",
                              top: 26,
                              left: 0,
                              background: "#fff",
                              borderRadius: 8,
                              boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
                              zIndex: 100,
                              minWidth: 140,
                              padding: "4px 0",
                              border: "0.5px solid #e0e0e0",
                            }}
                          >
                            {[
                              {
                                label: "All",
                                action: () =>
                                  setCheckedIds(
                                    new Set(filteredEmails.map((e) => e.id)),
                                  ),
                              },
                              {
                                label: "None",
                                action: () => setCheckedIds(new Set()),
                              },
                              {
                                label: "Read",
                                action: () =>
                                  setCheckedIds(
                                    new Set(
                                      filteredEmails
                                        .filter((e) => !e.unread)
                                        .map((e) => e.id),
                                    ),
                                  ),
                              },
                              {
                                label: "Unread",
                                action: () =>
                                  setCheckedIds(
                                    new Set(
                                      filteredEmails
                                        .filter((e) => e.unread)
                                        .map((e) => e.id),
                                    ),
                                  ),
                              },
                              {
                                label: "Starred",
                                action: () =>
                                  setCheckedIds(
                                    new Set(
                                      filteredEmails
                                        .filter((e) => e.starred)
                                        .map((e) => e.id),
                                    ),
                                  ),
                              },
                              {
                                label: "Unstarred",
                                action: () =>
                                  setCheckedIds(
                                    new Set(
                                      filteredEmails
                                        .filter((e) => !e.starred)
                                        .map((e) => e.id),
                                    ),
                                  ),
                              },
                            ].map(({ label, action }) => (
                              <div
                                key={label}
                                onClick={() => {
                                  action();
                                  setShowSelectDropdown(false);
                                }}
                                style={{
                                  padding: "8px 20px",
                                  fontSize: 14,
                                  color: "#202124",
                                  cursor: "pointer",
                                }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.background = "#f1f3f4")
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.background =
                                    "transparent")
                                }
                              >
                                {label}
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    {someChecked ? (
                      <>
                        <span
                          style={{
                            fontSize: 13,
                            color: "#202124",
                            marginLeft: 8,
                            marginRight: 4,
                          }}
                        >
                          {checkedIds.size} selected
                        </span>
                        {(activeNav === "Trash" ? [
                          {
                            label: "Delete forever",
                            Icon: MdDelete,
                            action: deleteForeverChecked,
                          },
                          {
                            label: "Restore to Inbox",
                            Icon: MdUndo,
                            action: restoreChecked,
                          },
                        ] : activeNav === "Spam" ? [
                          {
                            label: "Not spam",
                            Icon: MdInbox,
                            action: () => {
                              const ids = [...checkedIds];
                              const count = ids.length;
                              patchList((list) => list.filter((em) => !checkedIds.has(em.id)));
                              setCheckedIds(new Set());
                              showToast(`${count} conversation${count !== 1 ? "s" : ""} moved to Inbox.`);
                              ids.forEach((id) => fetch(`${API_URL}/emails/${id}/not-spam`, { method: "POST" }).catch(() => {}));
                            },
                          },
                          {
                            label: "Delete forever",
                            Icon: MdDelete,
                            action: () => {
                              const ids = [...checkedIds];
                              const count = ids.length;
                              patchList((list) => list.filter((em) => !checkedIds.has(em.id)));
                              setCheckedIds(new Set());
                              showToast(`${count} conversation${count !== 1 ? "s" : ""} permanently deleted.`);
                              ids.forEach((id) => fetch(`${API_URL}/emails/${id}/delete-forever`, { method: "POST" }).catch(() => {}));
                            },
                          },
                          {
                            label: "Mark read",
                            Icon: MdMarkEmailRead,
                            action: markCheckedRead,
                          },
                          {
                            label: "Mark unread",
                            Icon: MdMarkEmailUnread,
                            action: markCheckedUnread,
                          },
                        ] : [
                          {
                            label: "Archive",
                            Icon: MdArchive,
                            action: archiveChecked,
                          },
                          {
                            label: "Delete",
                            Icon: MdDelete,
                            action: deleteChecked,
                          },
                          {
                            label: "Mark read",
                            Icon: MdMarkEmailRead,
                            action: markCheckedRead,
                          },
                          {
                            label: "Mark unread",
                            Icon: MdMarkEmailUnread,
                            action: markCheckedUnread,
                          },
                        ]).map(({ label, Icon, action }) => (
                          <Tooltip key={label} label={label} position="bottom">
                            <button
                              onClick={action}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                borderRadius: "50%",
                                width: 32,
                                height: 32,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#5f6368",
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.background = "#d2e3fc")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.background = "none")
                              }
                            >
                              <Icon size={18} />
                            </button>
                          </Tooltip>
                        ))}
                      </>
                    ) : null}

                    {/* Refresh + more menu — right next to multiselect */}
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 2 }}
                    >
                      {/* Refresh */}
                      <Tooltip label="Refresh" position="bottom">
                        <button
                          onClick={refreshEmails}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            borderRadius: "50%",
                            width: 36,
                            height: 36,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#5f6368",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = "#f1f3f4")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "none")
                          }
                        >
                          <MdRefresh
                            size={20}
                            style={{
                              transition: "transform 0.5s",
                              transform: refreshing
                                ? "rotate(360deg)"
                                : "rotate(0deg)",
                            }}
                          />
                        </button>
                      </Tooltip>

                      {/* Three-dots menu */}
                      <div style={{ position: "relative" }}>
                        <Tooltip label="More" position="bottom">
                          <button
                            onClick={() => setShowMoreMenu((v) => !v)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              borderRadius: "50%",
                              width: 36,
                              height: 36,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#5f6368",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background = "#f1f3f4")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background = "none")
                            }
                          >
                            <MdMoreVert size={20} />
                          </button>
                        </Tooltip>

                        {showMoreMenu && (
                          <>
                            <div
                              onClick={() => setShowMoreMenu(false)}
                              style={{
                                position: "fixed",
                                inset: 0,
                                zIndex: 99,
                              }}
                            />
                            <div
                              style={{
                                position: "absolute",
                                top: 38,
                                left: 0,
                                background: "#fff",
                                borderRadius: 8,
                                boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
                                zIndex: 100,
                                minWidth: 180,
                                padding: "4px 0",
                                border: "0.5px solid #e0e0e0",
                              }}
                            >
                              {[
                                {
                                  label: "Mark all as read",
                                  action: markAllRead,
                                },
                              ].map(({ label, action }) => (
                                <div
                                  key={label}
                                  onClick={action}
                                  style={{
                                    padding: "10px 20px",
                                    fontSize: 14,
                                    color: "#202124",
                                    cursor: "pointer",
                                  }}
                                  onMouseEnter={(e) =>
                                    (e.currentTarget.style.background =
                                      "#f1f3f4")
                                  }
                                  onMouseLeave={(e) =>
                                    (e.currentTarget.style.background =
                                      "transparent")
                                  }
                                >
                                  {label}
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Spacer pushes pagination to the right */}
                    <div style={{ flex: 1 }} />

                    {/* Pagination — "1–50 of X" + prev/next arrows */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        color: "#5f6368",
                        fontSize: 13,
                      }}
                    >
                      <span style={{ marginRight: 6, whiteSpace: "nowrap" }}>
                        {pageStart}–{pageEnd} of {totalEmails}
                      </span>
                      <button
                        onClick={() => {
                          const dest = Math.max(1, activePage - 1);
                          queryClient.removeQueries({ queryKey: emailListKey(activeNav, dest) });
                          setActivePage(dest);
                        }}
                        disabled={activePage === 1}
                        title="Newer"
                        style={{
                          background: "none",
                          border: "none",
                          cursor: activePage === 1 ? "default" : "pointer",
                          borderRadius: "50%",
                          width: 36,
                          height: 36,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: activePage === 1 ? "#bdbdbd" : "#5f6368",
                        }}
                        onMouseEnter={(e) => {
                          if (activePage > 1)
                            e.currentTarget.style.background = "#f1f3f4";
                        }}
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "none")
                        }
                      >
                        <MdKeyboardArrowLeft size={20} />
                      </button>
                      <button
                        onClick={() => {
                          const dest = Math.min(totalPages, activePage + 1);
                          queryClient.removeQueries({ queryKey: emailListKey(activeNav, dest) });
                          setActivePage(dest);
                        }}
                        disabled={activePage === totalPages}
                        title="Older"
                        style={{
                          background: "none",
                          border: "none",
                          cursor:
                            activePage === totalPages ? "default" : "pointer",
                          borderRadius: "50%",
                          width: 36,
                          height: 36,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color:
                            activePage === totalPages ? "#bdbdbd" : "#5f6368",
                        }}
                        onMouseEnter={(e) => {
                          if (activePage < totalPages)
                            e.currentTarget.style.background = "#f1f3f4";
                        }}
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "none")
                        }
                      >
                        <MdKeyboardArrowRight size={20} />
                      </button>
                    </div>
                  </div>

                  {/* Email List */}
                  <div ref={emailListRef} style={{ flex: 1, overflowY: "auto" }}>
                    {loading && (
                      <div
                        style={{
                          padding: 40,
                          textAlign: "center",
                          color: "#5f6368",
                          fontSize: 14,
                        }}
                      >
                        {isSearching ? `Searching for "${debouncedSearch}"…` : "Loading emails..."}
                      </div>
                    )}
                    {isSearching && !loading && (
                      <div style={{ padding: "8px 16px 4px", fontSize: 13, color: "#5f6368" }}>
                        {totalEmails > 0
                          ? `Search results for "${debouncedSearch}"`
                          : `No results for "${debouncedSearch}"`}
                      </div>
                    )}
                    {!fetching && !autoPageRedirecting && filteredEmails.length === 0 && (
                      <div
                        style={{
                          padding: 40,
                          textAlign: "center",
                          color: "#5f6368",
                          fontSize: 14,
                        }}
                      >
                        {isSearching
                          ? `No results found for "${debouncedSearch}"`
                          : activeNav === "Starred"
                            ? "No starred messages"
                            : activeNav === "Sent"
                              ? "No sent messages"
                              : activeNav === "Drafts"
                                ? "No drafts"
                                : activeNav === "Trash"
                                  ? "Trash is empty"
                                  : activeNav === "Spam"
                                    ? "No spam messages"
                                    : activeNav === "Snoozed"
                                      ? "No snoozed messages"
                                      : "No emails found"}
                      </div>
                    )}
                    {activeNav === "Trash" && filteredEmails.length > 0 && (
                      <div style={{ padding: "8px 16px", fontSize: 13, color: "#5f6368", background: "#f6f8fc", borderBottom: "1px solid #e0e0e0" }}>
                        Messages that have been in Trash more than 30 days will be automatically deleted.&nbsp;
                        <span
                          style={{ color: "#1a73e8", cursor: "pointer" }}
                          onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none"; }}
                          onClick={() => {
                            const allIds = [...filteredEmails.map((e) => e.id)];
                            const count = allIds.length;
                            patchList(() => []);
                            setCheckedIds(new Set());
                            showToast(`${count} conversation${count !== 1 ? "s" : ""} permanently deleted.`);
                            fetch(`${API_URL}/emails/trash`, { method: "DELETE" }).catch(() => {});
                          }}
                        >
                          Empty Trash now
                        </span>
                      </div>
                    )}
                    {activeNav === "Spam" && (
                      <div style={{ padding: "8px 16px", fontSize: 13, color: "#5f6368", background: "#f6f8fc", borderBottom: "1px solid #e0e0e0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span>Messages that have been in Spam more than 30 days will be automatically deleted.</span>
                        {filteredEmails.length > 0 && (
                          <span
                            style={{ color: "#1a73e8", cursor: "pointer", whiteSpace: "nowrap", marginLeft: 12 }}
                            onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none"; }}
                            onClick={() => {
                              patchList(() => []);
                              setCheckedIds(new Set());
                              fetch(`${API_URL}/emails/spam`, { method: "DELETE" }).catch(() => {});
                            }}
                          >
                            Delete all spam messages now
                          </span>
                        )}
                      </div>
                    )}
                    {paginatedEmails.map((email) => {
                      const isChecked = checkedIds.has(email.id);
                      const isHovered = hoveredId === email.id;
                      const showCheckbox = isChecked || isHovered;
                      return (
                        <div
                          key={email.id}
                          onClick={() => openEmail(email.id)}
                          onMouseEnter={() => {
                            setHoveredId(email.id);
                            prefetchDetail(email.id);
                          }}
                          onMouseLeave={() => setHoveredId(null)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            padding: "10px 16px",
                            borderBottom: "0.5px solid #f0f0f0",
                            cursor: "pointer",
                            background: isChecked
                              ? "#e8f0fe"
                              : (readingPane && email.id === selectedId)
                                ? "#e8f0fe"
                                : isHovered
                                  ? "#f2f6fc"
                                  : email.unread
                                    ? "#fff"
                                    : "#f6f8fc",
                            transition: "background 0.1s",
                            fontWeight: email.unread ? 600 : 400,
                          }}
                        >
                          <div
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              background: email.unread
                                ? "#1a73e8"
                                : "transparent",
                              flexShrink: 0,
                            }}
                          />
                          {/* Avatar / Checkbox toggle */}
                          <div
                            onClick={(e) => toggleCheck(email.id, e)}
                            style={{
                              width: 32,
                              height: 32,
                              flexShrink: 0,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {showCheckbox ? (
                              <div
                                style={{
                                  width: 14,
                                  height: 14,
                                  border: `1.5px solid ${isChecked ? "#1a73e8" : "#5f6368"}`,
                                  borderRadius: 2,
                                  background: isChecked ? "#1a73e8" : "#fff",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}
                              >
                                {isChecked && (
                                  <span
                                    style={{
                                      color: "#fff",
                                      fontSize: 9,
                                      lineHeight: 1,
                                    }}
                                  >
                                    ✓
                                  </span>
                                )}
                              </div>
                            ) : (
                              <Avatar
                                initials={email.avatar}
                                color={email.avatarColor}
                                size={32}
                              />
                            )}
                          </div>
                          <span
                            onClick={(e) => toggleStar(email.id, e)}
                            style={{
                              cursor: "pointer",
                              flexShrink: 0,
                              color: email.starred ? "#F4B400" : "#ccc",
                              display: "flex",
                              alignItems: "center",
                              transition: "color 0.15s",
                            }}
                          >
                            {email.starred ? (
                              <MdStar size={18} />
                            ) : (
                              <MdStarBorder size={18} />
                            )}
                          </span>
                          <div
                            style={{
                              minWidth: 148,
                              maxWidth: 148,
                              display: "flex",
                              alignItems: "center",
                              gap: 3,
                              overflow: "hidden",
                            }}
                          >
                            <span
                              style={{
                                fontSize: 14,
                                color: "#202124",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                minWidth: 0,
                              }}
                            >
                              {activeNav === "Sent" ? `To: ${email.sender}` : email.sender}
                            </span>
                          </div>
                          <div
                            style={{
                              flex: 1,
                              display: "flex",
                              flexDirection: "column",
                              gap: 3,
                              overflow: "hidden",
                              minWidth: 0,
                            }}
                          >
                            {/* Subject + preview line */}
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                overflow: "hidden",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 14,
                                  color: "#202124",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {email.subject}
                              </span>
                              <span
                                style={{
                                  color: "#ccc",
                                  fontSize: 12,
                                  flexShrink: 0,
                                }}
                              >
                                —
                              </span>
                              <span
                                style={{
                                  fontSize: 14,
                                  color: "#5f6368",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {email.preview}
                              </span>
                            </div>

                            {/* Attachment chips */}
                            {email.attachments?.length > 0 && (
                              <div
                                style={{
                                  display: "flex",
                                  gap: 6,
                                  flexWrap: "wrap",
                                }}
                              >
                                {email.attachments.slice(0, 3).map((att, i) => {
                                  const isPdf =
                                    att.contentType === "application/pdf" ||
                                    att.filename
                                      ?.toLowerCase()
                                      .endsWith(".pdf");
                                  const isImage =
                                    att.contentType?.startsWith("image/");
                                  const Icon = isPdf
                                    ? MdPictureAsPdf
                                    : isImage
                                      ? MdImage
                                      : MdAttachFile;
                                  return (
                                    <div
                                      key={i}
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 4,
                                        borderRadius: 12,
                                        padding: "3px 10px 3px 7px",
                                        fontSize: 12,
                                        fontWeight: 500,
                                        maxWidth: 180,
                                        overflow: "hidden",
                                        flexShrink: 0,
                                        background: "#f1f3f4",
                                        color: "#444746",
                                      }}
                                    >
                                      <Icon
                                        size={15}
                                        style={{
                                          flexShrink: 0,
                                          color: isPdf ? "#c5221f" : "#5f6368",
                                        }}
                                      />
                                      <span
                                        style={{
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                          whiteSpace: "nowrap",
                                        }}
                                      >
                                        {att.filename}
                                      </span>
                                    </div>
                                  );
                                })}
                                {email.attachments.length > 3 && (
                                  <div
                                    style={{
                                      borderRadius: 12,
                                      padding: "3px 9px",
                                      background: "#f1f3f4",
                                      fontSize: 12,
                                      color: "#444746",
                                      fontWeight: 500,
                                      flexShrink: 0,
                                    }}
                                  >
                                    +{email.attachments.length - 3}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                              flexShrink: 0,
                              minWidth: 190,
                              justifyContent: "flex-end",
                            }}
                          >
                            {isHovered ? (
                              /* Hover action buttons */
                              <>
                                {/* Unsubscribe — text only, hidden in Trash */}
                                {activeNav !== "Trash" && (
                                <button
                                  title="Unsubscribe"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setUnsubscribeTarget({
                                      id: email.id,
                                      sender: email.sender,
                                    });
                                  }}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  style={{
                                    background: "none",
                                    border: "0.5px solid #c5c5c5",
                                    borderRadius: 4,
                                    cursor: "pointer",
                                    color: "#444746",
                                    fontSize: 12,
                                    fontWeight: 500,
                                    padding: "2px 8px",
                                    marginRight: 4,
                                    whiteSpace: "nowrap",
                                    lineHeight: "20px",
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background =
                                      "#f1f3f4";
                                    e.currentTarget.style.borderColor =
                                      "#444746";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = "none";
                                    e.currentTarget.style.borderColor =
                                      "#c5c5c5";
                                  }}
                                >
                                  Unsubscribe
                                </button>
                                )}

                                {/* Icon action buttons */}
                                {(activeNav === "Trash" ? [
                                  {
                                    Icon: MdDelete,
                                    title: "Delete forever",
                                    action: async (e) => {
                                      e.stopPropagation();
                                      patchList((list) => list.filter((em) => em.id !== email.id));
                                      showToast("Conversation permanently deleted.");
                                      await fetch(`${API_URL}/emails/${email.id}/delete-forever`, { method: "POST" });
                                    },
                                  },
                                  {
                                    Icon: MdUndo,
                                    title: "Restore to Inbox",
                                    action: async (e) => {
                                      e.stopPropagation();
                                      patchList((list) => list.filter((em) => em.id !== email.id));
                                      showToast("Conversation restored to Inbox.");
                                      await fetch(`${API_URL}/emails/${email.id}/restore`, { method: "POST" });
                                    },
                                  },
                                ] : activeNav === "Spam" ? [
                                  {
                                    Icon: MdInbox,
                                    title: "Not spam",
                                    action: async (e) => {
                                      e.stopPropagation();
                                      const savedEmail = email;
                                      patchList((list) => list.filter((em) => em.id !== email.id));
                                      showToast("Conversation moved to Inbox.");
                                      await fetch(`${API_URL}/emails/${email.id}/not-spam`, { method: "POST" });
                                    },
                                  },
                                  {
                                    Icon: MdDelete,
                                    title: "Delete forever",
                                    action: async (e) => {
                                      e.stopPropagation();
                                      patchList((list) => list.filter((em) => em.id !== email.id));
                                      showToast("Conversation permanently deleted.");
                                      await fetch(`${API_URL}/emails/${email.id}/delete-forever`, { method: "POST" });
                                    },
                                  },
                                  {
                                    Icon: MdMarkEmailUnread,
                                    title: "Mark as unread",
                                    action: async (e) => {
                                      e.stopPropagation();
                                      const emailId = email.id;
                                      patchList((list) => list.map((em) => em.id === emailId ? { ...em, unread: true } : em));
                                      showToast("Marked as unread.", {
                                        label: "Undo",
                                        onClick: () => {
                                          patchList((list) => list.map((em) => em.id === emailId ? { ...em, unread: false } : em));
                                          fetch(`${API_URL}/emails/${emailId}/mark-read?folder=spam`, { method: "POST" }).catch(() => {});
                                          showToast("Action undone.");
                                        },
                                      });
                                      await fetch(`${API_URL}/emails/${emailId}/mark-unread?folder=spam`, { method: "POST" });
                                    },
                                  },
                                ] : [
                                  {
                                    Icon: MdArchive,
                                    title: "Archive",
                                    action: async (e) => {
                                      e.stopPropagation();
                                      const savedEmail = email;
                                      patchList((list) =>
                                        list.filter((em) => em.id !== email.id),
                                      );
                                      const fp = activeNav === "Sent" ? "?folder=sent" : activeNav === "Drafts" ? "?folder=drafts" : "";
                                      showToast("Conversation archived.", {
                                        label: "Undo",
                                        onClick: () => {
                                          patchList((list) => [savedEmail, ...list]);
                                          fetch(`${API_URL}/emails/${savedEmail.id}/restore`, { method: "POST" }).catch(() => {});
                                          showToast("Action undone.");
                                        },
                                      });
                                      await fetch(`${API_URL}/emails/${email.id}/archive${fp}`, { method: "POST" });
                                    },
                                  },
                                  {
                                    Icon: MdDelete,
                                    title: "Delete",
                                    action: async (e) => {
                                      e.stopPropagation();
                                      const savedEmail = email;
                                      patchList((list) => list.filter((em) => em.id !== savedEmail.id));
                                      showToast("Conversation moved to Trash.", {
                                        label: "Undo",
                                        onClick: () => {
                                          patchList((list) => [savedEmail, ...list]);
                                          fetch(`${API_URL}/emails/${savedEmail.id}/restore`, { method: "POST" }).catch(() => {});
                                          showToast("Action undone.");
                                        },
                                      });
                                      const fp = activeNav === "Sent" ? "?folder=sent" : activeNav === "Drafts" ? "?folder=drafts" : "";
                                      await fetch(`${API_URL}/emails/${savedEmail.id}/trash${fp}`, { method: "POST" });
                                    },
                                  },
                                  {
                                    Icon: MdMarkEmailUnread,
                                    title: "Mark as unread",
                                    action: async (e) => {
                                      e.stopPropagation();
                                      const emailId = email.id;
                                      patchList((list) =>
                                        list.map((em) =>
                                          em.id === emailId
                                            ? { ...em, unread: true }
                                            : em,
                                        ),
                                      );
                                      const fp = activeNav === "Sent" ? "?folder=sent" : activeNav === "Drafts" ? "?folder=drafts" : activeNav === "Trash" ? "?folder=trash" : activeNav === "Spam" ? "?folder=spam" : "";
                                      showToast("Marked as unread.", {
                                        label: "Undo",
                                        onClick: () => {
                                          patchList((list) => list.map((em) => em.id === emailId ? { ...em, unread: false } : em));
                                          fetch(`${API_URL}/emails/${emailId}/mark-read${fp}`, { method: "POST" }).catch(() => {});
                                          showToast("Action undone.");
                                        },
                                      });
                                      await fetch(`${API_URL}/emails/${emailId}/mark-unread${fp}`, { method: "POST" });
                                    },
                                  },
                                  {
                                    Icon: MdAccessTime,
                                    title: "Snooze",
                                    action: (e) => {
                                      e.stopPropagation();
                                      setSnoozeTarget({ id: email.id, folder: email.sourceFolder || (activeNav === "Sent" ? "sent" : activeNav === "Drafts" ? "drafts" : "inbox") });
                                    },
                                  },
                                ]).map(({ Icon, title, action }) => (
                                  <Tooltip key={title} label={title} position="bottom">
                                    <button
                                      onClick={action}
                                      onMouseDown={(e) => e.stopPropagation()}
                                      style={{
                                        background: "none",
                                        border: "none",
                                        cursor: "pointer",
                                        color: "#5f6368",
                                        width: 28,
                                        height: 28,
                                        borderRadius: "50%",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0,
                                      }}
                                      onMouseEnter={(e) => {
                                        e.stopPropagation();
                                        e.currentTarget.style.background = "rgba(0,0,0,0.08)";
                                      }}
                                      onMouseLeave={(e) =>
                                        (e.currentTarget.style.background = "none")
                                      }
                                    >
                                      <Icon size={16} />
                                    </button>
                                  </Tooltip>
                                ))}
                              </>
                            ) : (
                              /* Normal: label chip + time */
                              <>
                                {email.label && email.label !== "inbox" && (
                                  <span
                                    style={{
                                      fontSize: 11,
                                      padding: "2px 7px",
                                      borderRadius: 4,
                                      fontWeight: 500,
                                      background: LABEL_STYLES[email.label]?.bg,
                                      color: LABEL_STYLES[email.label]?.color,
                                    }}
                                  >
                                    {email.label.charAt(0).toUpperCase() +
                                      email.label.slice(1)}
                                  </span>
                                )}
                                {email.snoozeUntil && (
                                  <span style={{ display: "flex", alignItems: "center", gap: 2, color: "#f29900", fontSize: 12, marginRight: 4, whiteSpace: "nowrap" }}>
                                    <MdAccessTime size={13} />
                                    {new Date(email.snoozeUntil).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                  </span>
                                )}
                                <span
                                  style={{
                                    fontSize: 12,
                                    color: "#5f6368",
                                    minWidth: 52,
                                    textAlign: "right",
                                    fontWeight: email.unread ? 700 : 400,
                                  }}
                                >
                                  {email.time}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
            )}
            {/* Resize handle — visible gap with hidden drag bar that appears on hover */}
            {readingPane && (
              <div
                onMouseDown={(e) => {
                  paneDragRef.current = { active: true, startX: e.clientX, startWidth: listPaneWidth };
                  setIsPaneDragging(true);
                  e.preventDefault();
                }}
                style={{
                  width: 12,
                  flexShrink: 0,
                  cursor: "col-resize",
                  background: "#f0f4f9",
                  position: "relative",
                  userSelect: "none",
                }}
              >
                {/* Thin indicator line — hidden until hover or drag */}
                <div style={{
                  position: "absolute",
                  top: 0, bottom: 0,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: isPaneDragging ? 2 : 0,
                  background: isPaneDragging ? "#1a73e8" : "#bdbdbd",
                  transition: isPaneDragging ? "none" : "width 0.15s, background 0.15s",
                  pointerEvents: "none",
                }} className="pane-resize-line" />
              </div>
            )}
            {/* Email detail — right panel in reading pane; full screen in normal mode */}
            {selectedEmail && (() => {
              const emailIdx = paginatedEmails.findIndex((e) => e.id === selectedId);
              const emailPosition = pageStart + emailIdx;
              return (
                <EmailDetail
                  email={selectedEmail}
                  onClose={() => setSelectedId(null)}
                  onReply={(draft) => handlePendingSend(draft)}
                  onForward={(draft) => handlePendingSend(draft)}
                  onDelete={() => {
                    patchList((list) => list.filter((em) => em.id !== selectedEmail.id));
                    setSelectedId(null);
                  }}
                  onToast={showToast}
                  onRestoreEmail={(emailData) => { patchList((list) => [emailData, ...list]); }}
                  onUpdateEmail={(updates) => {
                    patchList((list) => list.map((em) => em.id === selectedEmail.id ? { ...em, ...updates } : em));
                  }}
                  onMarkUnread={() => {
                    patchList((list) =>
                      list.map((em) => em.id === selectedEmail.id ? { ...em, unread: true } : em),
                    );
                    setSelectedId(null);
                  }}
                  emailPosition={emailPosition}
                  totalEmails={totalEmails}
                  folder={activeNav === "Sent" ? "sent" : activeNav === "Drafts" ? "drafts" : activeNav === "Trash" ? "trash" : activeNav === "Spam" ? "spam" : activeNav === "Snoozed" ? (selectedEmail?.sourceFolder || "inbox") : "inbox"}
                  onPrev={emailIdx > 0 ? () => setSelectedId(paginatedEmails[emailIdx - 1].id) : null}
                  onNext={emailIdx < paginatedEmails.length - 1 ? () => setSelectedId(paginatedEmails[emailIdx + 1].id) : null}
                />
              );
            })()}
            {/* Reading pane empty state */}
            {readingPane && !selectedEmail && (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 14, color: "#9aa0a6", userSelect: "none", background: "#f6f8fc" }}>
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <span style={{ fontSize: 15 }}>Select an email to read</span>
              </div>
            )}
          </div>

          {/* Storage bar — bottom of email list, visible on every page */}
          {storageInfo && (
            <div style={{ padding: "10px 16px 12px", borderTop: "1px solid #e0e0e0", background: "#fff" }}>
              <div style={{ maxWidth: 340 }}>
                <div style={{ height: 4, borderRadius: 2, background: "#e0e0e0", overflow: "hidden", marginBottom: 5 }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${storageInfo.percent}%`,
                      borderRadius: 2,
                      background: storageInfo.percent >= 90 ? "#d93025" : storageInfo.percent >= 75 ? "#f29900" : "#1a73e8",
                      transition: "width 0.5s ease",
                    }}
                  />
                </div>
                <span style={{ fontSize: 12, color: "#5f6368" }}>
                  {storageInfo.usedFmt} ({storageInfo.percent}%) of {storageInfo.limitFmt} used
                </span>
              </div>
            </div>
          )}
        </div>}
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <ComposeModal
          key={composeKey}
          initialDraft={composeDraft}
          onClose={() => {
            setShowCompose(false);
            setComposeMinimized(false);
            setComposeDraft(null);
            // Refresh Drafts folder so badge + list stay in sync
            setTimeout(() => {
              queryClient.invalidateQueries({ queryKey: ["emails", "Drafts"] });
            }, 500);
          }}
          onPendingSend={handlePendingSend}
          minimized={composeMinimized}
          onMinimize={() => setComposeMinimized((m) => !m)}
        />
      )}

      {/* ── Sent toast (bottom-left, Gmail-style) ── */}
      <div
        style={{
          position: "fixed",
          bottom: 32,
          left: 32,
          background: "#323232",
          color: "#fff",
          fontSize: 16,
          padding: "14px 12px 14px 20px",
          borderRadius: 6,
          boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
          display: "flex",
          alignItems: "center",
          gap: 12,
          minWidth: 320,
          pointerEvents: toast ? "auto" : "none",
          opacity: toast ? 1 : 0,
          transform: toast ? "translateY(0)" : "translateY(16px)",
          transition: "opacity 0.2s ease, transform 0.2s ease",
          zIndex: 9999,
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ marginRight: 8, fontSize: 16 }}>{toast?.message}</span>
        {(toast?.actions || []).map((a) => (
          <button
            key={a.label}
            onClick={a.onClick}
            style={{
              background: "none",
              border: "none",
              color: "#8ab4f8",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              padding: "0 10px",
              whiteSpace: "nowrap",
            }}
          >
            {a.label}
          </button>
        ))}
        <button
          onClick={() => { clearTimeout(toastTimer.current); clearTimeout(undoTimer.current); setToast(null); }}
          style={{
            background: "none",
            border: "none",
            color: "#fff",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            padding: "4px",
            borderRadius: "50%",
            opacity: 0.8,
          }}
          aria-label="Close"
        >
          <MdClose size={18} />
        </button>
      </div>

      {/* Unsubscribe Confirmation Dialog */}
      {unsubscribeTarget && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => !unsubscribing && setUnsubscribeTarget(null)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.4)",
              zIndex: 300,
            }}
          />
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%,-50%)",
              background: "#fff",
              borderRadius: 12,
              boxShadow: "0 8px 40px rgba(0,0,0,0.28)",
              zIndex: 301,
              width: 420,
              padding: "28px 28px 20px",
            }}
          >
            <div
              style={{
                fontSize: 18,
                fontWeight: 500,
                color: "#202124",
                marginBottom: 12,
              }}
            >
              Unsubscribe from {unsubscribeTarget.sender}?
            </div>
            <div
              style={{
                fontSize: 14,
                color: "#5f6368",
                lineHeight: 1.6,
                marginBottom: 24,
              }}
            >
              {unsubscribeTarget.sender} will be unsubscribed and the message
              will be moved to Spam.
            </div>
            <div
              style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}
            >
              <button
                onClick={() => setUnsubscribeTarget(null)}
                disabled={unsubscribing}
                style={{
                  background: "none",
                  border: "none",
                  borderRadius: 20,
                  padding: "8px 20px",
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: unsubscribing ? "default" : "pointer",
                  color: "#1a73e8",
                  opacity: unsubscribing ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!unsubscribing)
                    e.currentTarget.style.background = "#e8f0fe";
                }}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "none")
                }
              >
                Cancel
              </button>
              <button
                onClick={confirmUnsubscribe}
                disabled={unsubscribing}
                style={{
                  background: "#1a73e8",
                  color: "#fff",
                  border: "none",
                  borderRadius: 20,
                  padding: "8px 20px",
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: unsubscribing ? "default" : "pointer",
                  opacity: unsubscribing ? 0.7 : 1,
                  minWidth: 110,
                }}
              >
                {unsubscribing ? "Unsubscribing…" : "Unsubscribe"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Help dropdown menu ── */}
      {showHelpMenu && (
        <>
          <div onClick={() => setShowHelpMenu(false)} style={{ position: "fixed", inset: 0, zIndex: 1498 }} />
          <div style={{
            position: "fixed",
            top: (() => { const r = helpBtnRef.current?.getBoundingClientRect(); return r ? r.bottom + 8 : 60; })(),
            right: 12,
            background: "#fff",
            borderRadius: 8,
            boxShadow: "0 4px 20px rgba(0,0,0,0.22)",
            zIndex: 1499,
            width: 288,
            overflow: "hidden",
            fontFamily: "'Google Sans', Roboto, Arial, sans-serif",
          }}>
            {/* Search bar */}
            {/* <div style={{ padding: "12px 16px 8px", borderBottom: "1px solid #f1f3f4" }}>
              <div style={{ display: "flex", alignItems: "center", background: "#f1f3f4", borderRadius: 24, padding: "6px 12px", gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5f6368" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <input
                  placeholder="Search for help"
                  autoFocus
                  style={{ border: "none", background: "none", outline: "none", fontSize: 14, color: "#202124", width: "100%", fontFamily: "inherit" }}
                  onKeyDown={e => { if (e.key === "Enter") { window.open("https://support.google.com/mail", "_blank"); setShowHelpMenu(false); } }}
                />
              </div>
            </div> */}

            {/* Menu items */}
            {[
              { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>, label: "Help Center", action: () => { setComposeDraft({ recipients: [{ name: "Support", email: "support@yana.africa" }], subject: "Help Request", body: "", attachments: [] }); setComposeKey(k => k + 1); setShowCompose(true); setComposeMinimized(false); setShowHelpMenu(false); } },
              // { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>, label: "Training", action: () => { window.open("https://workspace.google.com/learning-center/", "_blank"); setShowHelpMenu(false); } },
              // { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>, label: "Updates", action: () => { window.open("https://workspace.google.com/whatsnew/", "_blank"); setShowHelpMenu(false); } },
              // { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M8 10h8M8 14h4"/></svg>, label: "Keyboard shortcuts", action: () => { setShowShortcuts(true); setShowHelpMenu(false); } },
              // { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>, label: "Send feedback", action: () => { window.open("mailto:feedback@example.com?subject=Feedback", "_blank"); setShowHelpMenu(false); } },
            ].map(item => (
              <div key={item.label} onClick={item.action}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", cursor: "pointer", fontSize: 14, color: "#202124" }}
                onMouseEnter={e => e.currentTarget.style.background = "#f1f3f4"}
                onMouseLeave={e => e.currentTarget.style.background = "none"}
              >
                <span style={{ color: "#5f6368", display: "flex" }}>{item.icon}</span>
                {item.label}
              </div>
            ))}

            {/* <div style={{ borderTop: "1px solid #f1f3f4", margin: "4px 0" }} /> */}

            {/* Support toggle */}
            {/* <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px 14px", gap: 12 }}>
              <div>
                <div style={{ fontSize: 14, color: "#202124", fontWeight: 500 }}>Support</div>
                <div style={{ fontSize: 12, color: "#5f6368", marginTop: 2 }}>{supportEnabled ? "Panel is visible" : "Panel is hidden"}</div>
              </div>
              <div
                onClick={() => toggleSupport(!supportEnabled)}
                style={{
                  width: 44, height: 24, borderRadius: 12, flexShrink: 0,
                  background: supportEnabled ? "#1a73e8" : "#bdc1c6",
                  position: "relative", cursor: "pointer", transition: "background 0.2s",
                }}
              >
                <div style={{
                  position: "absolute", top: 2, left: supportEnabled ? 22 : 2,
                  width: 20, height: 20, borderRadius: "50%", background: "#fff",
                  transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                }} />
              </div>
            </div> */}
          </div>
        </>
      )}

      {/* ── Keyboard shortcuts modal ── */}
      {showShortcuts && (
        <>
          <div onClick={() => setShowShortcuts(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 2000 }} />
          <div style={{
            position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
            background: "#fff", borderRadius: 12, boxShadow: "0 8px 40px rgba(0,0,0,0.22)",
            zIndex: 2001, width: 580, maxWidth: "96vw", maxHeight: "82vh",
            display: "flex", flexDirection: "column", fontFamily: "'Google Sans', Roboto, Arial, sans-serif",
          }}>
            <div style={{ display: "flex", alignItems: "center", padding: "20px 24px 16px", borderBottom: "1px solid #e0e0e0" }}>
              <span style={{ fontSize: 18, fontWeight: 600, color: "#202124", flex: 1 }}>Keyboard shortcuts</span>
              <button onClick={() => setShowShortcuts(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#5f6368", padding: 4, borderRadius: "50%", display: "flex" }}
                onMouseEnter={e => e.currentTarget.style.background = "#f1f3f4"}
                onMouseLeave={e => e.currentTarget.style.background = "none"}>
                <MdClose size={22} />
              </button>
            </div>
            <div style={{ overflowY: "auto", padding: "16px 24px 24px" }}>
              {[
                { section: "Navigation", items: [
                  ["c", "Compose new email"],
                  ["/", "Search"],
                  ["?", "Open keyboard shortcuts"],
                  ["Esc", "Close current view"],
                ]},
                { section: "Email actions", items: [
                  ["e", "Archive"],
                  ["#", "Delete"],
                  ["!", "Mark as spam"],
                  ["r", "Reply"],
                  ["f", "Forward"],
                  ["s", "Star / unstar"],
                  ["Shift + u", "Mark as unread"],
                ]},
                { section: "Navigation", items: [
                  ["j / n", "Older conversation"],
                  ["k / p", "Newer conversation"],
                  ["u", "Back to inbox"],
                ]},
                { section: "Selection", items: [
                  ["* + a", "Select all"],
                  ["* + n", "Select none"],
                  ["* + r", "Select read"],
                  ["* + u", "Select unread"],
                ]},
              ].map(group => (
                <div key={group.section} style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#1a73e8", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 8 }}>{group.section}</div>
                  {group.items.map(([key, desc]) => (
                    <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: "0.5px solid #f1f3f4" }}>
                      <span style={{ fontSize: 14, color: "#202124" }}>{desc}</span>
                      <kbd style={{ fontFamily: "monospace", fontSize: 12, background: "#f1f3f4", border: "1px solid #dadce0", borderRadius: 4, padding: "2px 8px", color: "#202124", whiteSpace: "nowrap" }}>{key}</kbd>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Support panel (right-side contextual help) ── */}
      {supportEnabled && (
        <div style={{
          position: "fixed", top: 56, right: 0, bottom: 0, width: 300,
          background: "#fff", borderLeft: "1px solid #e0e0e0",
          boxShadow: "-2px 0 8px rgba(0,0,0,0.08)", zIndex: 900,
          display: "flex", flexDirection: "column",
          fontFamily: "'Google Sans', Roboto, Arial, sans-serif",
          transition: "transform 0.25s ease",
        }}>
          <div style={{ display: "flex", alignItems: "center", padding: "14px 16px", borderBottom: "1px solid #e0e0e0" }}>
            <span style={{ fontSize: 16, fontWeight: 600, color: "#202124", flex: 1 }}>Support</span>
            <button onClick={() => toggleSupport(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#5f6368", padding: 4, borderRadius: "50%", display: "flex" }}
              onMouseEnter={e => e.currentTarget.style.background = "#f1f3f4"}
              onMouseLeave={e => e.currentTarget.style.background = "none"}>
              <MdClose size={20} />
            </button>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
            {/* Search */}
            <div style={{ display: "flex", alignItems: "center", background: "#f1f3f4", borderRadius: 24, padding: "7px 14px", gap: 8, marginBottom: 20 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5f6368" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input placeholder="Search help…" style={{ border: "none", background: "none", outline: "none", fontSize: 14, color: "#202124", width: "100%", fontFamily: "inherit" }} />
            </div>
            {/* Popular topics */}
            <div style={{ fontSize: 12, fontWeight: 700, color: "#5f6368", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 10 }}>Popular topics</div>
            {[
              "How to send an email",
              "Manage your inbox",
              "Set up email signature",
              "Keyboard shortcuts",
              "Filter and sort emails",
              "Manage folders",
              "Set up reading pane",
              "Search for emails",
            ].map(topic => (
              <div key={topic} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 4px", cursor: "pointer", borderRadius: 4, fontSize: 14, color: "#1a73e8" }}
                onMouseEnter={e => e.currentTarget.style.background = "#f1f3f4"}
                onMouseLeave={e => e.currentTarget.style.background = "none"}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                {topic}
              </div>
            ))}
            <div style={{ borderTop: "1px solid #e0e0e0", margin: "16px 0" }} />
            {/* Contact */}
            <div style={{ fontSize: 12, fontWeight: 700, color: "#5f6368", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 10 }}>Contact support</div>
            <div
              onClick={() => window.open("mailto:support@example.com", "_blank")}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", cursor: "pointer", borderRadius: 8, border: "1px solid #dadce0", fontSize: 14, color: "#202124" }}
              onMouseEnter={e => e.currentTarget.style.background = "#f1f3f4"}
              onMouseLeave={e => e.currentTarget.style.background = "none"}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              <div>
                <div style={{ fontWeight: 500 }}>Email support</div>
                <div style={{ fontSize: 12, color: "#5f6368" }}>support@example.com</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <SettingsModal onClose={() => setShowSettingsModal(false)} readingPane={readingPane} setReadingPane={setReadingPane} />
      )}

      {/* Snooze time picker */}
      {snoozeTarget && (
        <>
          <div onClick={() => setSnoozeTarget(null)} style={{ position: "fixed", inset: 0, zIndex: 1000 }} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "#fff", borderRadius: 8, boxShadow: "0 8px 32px rgba(0,0,0,0.22)", zIndex: 1001, minWidth: 280, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px 8px", fontSize: 15, fontWeight: 500, color: "#202124" }}>Snooze until…</div>
            {getSnoozeOptions().map((opt) => (
              <div
                key={opt.label}
                onClick={() => confirmSnooze(opt.time)}
                style={{ padding: "10px 20px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14, color: "#202124" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#f1f3f4"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
              >
                <span>{opt.label}</span>
                <span style={{ color: "#5f6368", fontSize: 13 }}>{opt.display}</span>
              </div>
            ))}
            <div style={{ padding: "8px 20px 14px" }}>
              <div
                onClick={() => setSnoozeTarget(null)}
                style={{ fontSize: 13, color: "#1a73e8", cursor: "pointer", textAlign: "center", padding: "6px 0" }}
                onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline"; }}
                onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none"; }}
              >
                Cancel
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

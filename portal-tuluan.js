// =========================================================
// FILE: portal-tuluan.js
// QUẢN LÝ NỘP BÀI TỰ LUẬN GOOGLE DRIVE 5TB & ĐỒNG BỘ 100% QUA SUPABASE
// BẢO MẬT XÓA ẢNH (CHỈ CHÍNH CHỦ & ADMIN) | QUẢN LÝ 5 ĐỀ MỚI NHẤT
// TỰ ĐỘNG TẠO THƯ MỤC DRIVE PHÂN CẤP THEO LỚP ĐANG CHỌN (11C, 11A, 10P...)
// NÚT XÓA ĐỀ CHỈ HIỆN KHI LÀ ADMIN | ĐỔI MẬT KHẨU 4 SỐ NỔI LÊN TRÊN
// CỘT CHẤM CHÉO NHAU (GHI NHẬN DANH TÍNH & HIỆN TOOLTIP KHI HOVER)
// CỘT NHẬN XÉT (XÒE RA) & XUẤT EXCEL KÈM ẢNH BÀI LÀM VÀ NGƯỜI CHẤM
// BỔ SUNG: NÚT UPLOAD ĐÁP ÁN CHẤM LÊN DRIVE KHO_TAI_LIEU/Dap_an_cham_tu_luan
// VÀ NÚT HẸN GIỜ TỰ ĐỘNG MỞ ĐÁP ÁN CHO HỌC SINH ĐỒNG BỘ QUA SUPABASE!
// =========================================================

// TỰ ĐỘNG NHÚNG CSS BẢNG TỰ LUẬN, NÚT LỚP SIÊU GỌN, ĐÁP ÁN CHẤM & HẸN GIỜ
(function injectTuLuanButtonStyles() {
    const styleId = "tuluan-custom-delete-btn-styles";
    if (document.getElementById(styleId)) return;
    const style = document.createElement("style");
    style.id = styleId;
    style.innerHTML = `
        .tuluan-img-thumbnail-item {
            position: relative !important;
            display: inline-block !important;
        }
        .btn-del-single-thumb {
            position: absolute !important;
            top: 2px !important;
            right: 2px !important;
            width: 18px !important;
            height: 18px !important;
            background: #ef4444 !important;
            color: #ffffff !important;
            border: 1px solid #ffffff !important;
            border-radius: 50% !important;
            font-size: 10px !important;
            font-weight: 900 !important;
            line-height: 1 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            cursor: pointer !important;
            box-shadow: 0 1px 4px rgba(0, 0, 0, 0.45) !important;
            z-index: 20 !important;
            padding: 0 !important;
            user-select: none !important;
            transition: transform 0.15s ease, background 0.15s ease !important;
        }
        .btn-del-single-thumb:hover {
            background: #b91c1c !important;
            transform: scale(1.2) !important;
        }
        .btn-del-single-thumb:active {
            transform: scale(0.9) !important;
        }

        /* NÚT LỚP THU GỌN SIÊU BÉ */
        .tuluan-class-compact-select {
            width: 82px !important;
            max-width: 82px !important;
            padding: 4px 4px !important;
            font-size: 11.5px !important;
            font-weight: 800 !important;
            border-radius: 7px !important;
            border: 1.2px solid #cbd5e1 !important;
            background: #ffffff !important;
            color: #0f172a !important;
            height: 30px !important;
            cursor: pointer !important;
            text-overflow: ellipsis !important;
        }

        /* NÚT UPLOAD & HIỂN THỊ ĐÁP ÁN CHẤM BÊN PHẢI NÚT LỚP */
        .tuluan-dapan-mini-box {
            display: inline-flex !important;
            align-items: center !important;
            gap: 4px !important;
            flex-shrink: 0 !important;
        }
        .btn-tuluan-upload-dapan {
            background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%) !important;
            color: #ffffff !important;
            border: 1.2px solid #38bdf8 !important;
            border-radius: 7px !important;
            padding: 4px 8px !important;
            font-size: 11px !important;
            font-weight: 800 !important;
            cursor: pointer !important;
            height: 30px !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 3px !important;
            transition: all 0.15s ease !important;
            box-shadow: 0 2px 5px rgba(2, 132, 199, 0.25) !important;
            white-space: nowrap !important;
            user-select: none !important;
        }
        .btn-tuluan-upload-dapan:hover {
            filter: brightness(1.1) !important;
            transform: translateY(-1px) !important;
        }
        .btn-tuluan-upload-dapan:active {
            transform: translateY(2px) scale(0.96) !important;
        }

        /* NÚT HẸN GIỜ MỞ ĐÁP ÁN (BÊN CẠNH NÚT UP ĐÁP ÁN) */
        .btn-tuluan-schedule-dapan {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%) !important;
            color: #ffffff !important;
            border: 1.2px solid #fde68a !important;
            border-radius: 7px !important;
            padding: 4px 8px !important;
            font-size: 11px !important;
            font-weight: 800 !important;
            cursor: pointer !important;
            height: 30px !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 3px !important;
            transition: all 0.15s ease !important;
            box-shadow: 0 2px 5px rgba(245, 158, 11, 0.25) !important;
            white-space: nowrap !important;
            user-select: none !important;
        }
        .btn-tuluan-schedule-dapan:hover {
            filter: brightness(1.1) !important;
            transform: translateY(-1px) !important;
        }
        .btn-tuluan-schedule-dapan:active {
            transform: translateY(2px) scale(0.96) !important;
        }
        .btn-tuluan-schedule-dapan.has-schedule {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
            border-color: #86efac !important;
        }

        /* POPOVER CẤU HÌNH HẸN GIỜ MỞ ĐÁP ÁN */
        .dapan-schedule-popover {
            display: none;
            position: absolute !important;
            top: calc(100% + 6px) !important;
            left: 0 !important;
            width: 310px !important;
            background: #ffffff !important;
            border: 1.5px solid #f59e0b !important;
            border-radius: 14px !important;
            padding: 12px 14px !important;
            box-shadow: 0 16px 40px rgba(15, 23, 42, 0.35), 0 0 0 1px rgba(245, 158, 11, 0.2) !important;
            z-index: 100000 !important;
            text-align: left !important;
            animation: popInBadge 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .dapan-schedule-popover.show {
            display: block !important;
        }
        .dapan-sched-radio-item {
            display: flex !important;
            align-items: flex-start !important;
            gap: 7px !important;
            margin-bottom: 8px !important;
            cursor: pointer !important;
            font-size: 12px !important;
            font-weight: 700 !important;
            color: #1e293b !important;
        }
        .dapan-sched-radio-item input[type="radio"] {
            margin-top: 2px !important;
            accent-color: #f59e0b !important;
            cursor: pointer !important;
        }
        .dapan-sched-input {
            width: 100% !important;
            padding: 6px 8px !important;
            border: 1.2px solid #cbd5e1 !important;
            border-radius: 7px !important;
            font-size: 12px !important;
            font-weight: 700 !important;
            outline: none !important;
            box-sizing: border-box !important;
            color: #0f172a !important;
            margin-top: 4px !important;
        }
        .dapan-sched-input:focus {
            border-color: #f59e0b !important;
            box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.15) !important;
        }
        .btn-quick-deadline {
            display: inline-flex !important;
            align-items: center !important;
            gap: 3px !important;
            padding: 4px 8px !important;
            background: #fffbeb !important;
            border: 1px solid #fde68a !important;
            border-radius: 6px !important;
            font-size: 11px !important;
            font-weight: 800 !important;
            color: #b45309 !important;
            cursor: pointer !important;
            margin-top: 5px !important;
            transition: 0.15s !important;
        }
        .btn-quick-deadline:hover {
            background: #fef3c7 !important;
            color: #92400e !important;
        }

        .btn-dapan-badge-active {
            background: #f0fdf4 !important;
            border: 1.2px solid #86efac !important;
            color: #166534 !important;
            border-radius: 7px !important;
            padding: 3px 7px !important;
            font-size: 11px !important;
            font-weight: 800 !important;
            text-decoration: none !important;
            display: inline-flex !important;
            align-items: center !important;
            gap: 4px !important;
            height: 30px !important;
            box-sizing: border-box !important;
            max-width: 140px !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            transition: 0.15s !important;
        }
        .btn-dapan-badge-active:hover {
            background: #dcfce7 !important;
            border-color: #22c55e !important;
        }
        .btn-dapan-badge-active.is-locked {
            background: #fffbeb !important;
            border-color: #fde68a !important;
            color: #b45309 !important;
            cursor: not-allowed !important;
        }
        .badge-moi-mini {
            background: #0284c7 !important;
            color: #ffffff !important;
            font-size: 9px !important;
            font-weight: 900 !important;
            padding: 1px 4px !important;
            border-radius: 4px !important;
            flex-shrink: 0 !important;
        }
        .dapan-filename-truncate {
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            white-space: nowrap !important;
            font-weight: 700 !important;
        }

        .btn-del-dapan-mini {
            background: #fee2e2 !important;
            color: #dc2626 !important;
            border: 1px solid #fca5a5 !important;
            border-radius: 50% !important;
            width: 20px !important;
            height: 20px !important;
            font-size: 10px !important;
            font-weight: 900 !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            cursor: pointer !important;
            padding: 0 !important;
            flex-shrink: 0 !important;
            transition: 0.15s !important;
        }
        .btn-del-dapan-mini:hover {
            background: #dc2626 !important;
            color: #ffffff !important;
        }

        /* DÒNG HIỂN THỊ ĐÁP ÁN ĐẦY ĐỦ PHONG CÁCH DÂN TRÍ NHƯ ẢNH CHỤP */
        .tuluan-dapan-full-strip {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            padding: 6px 12px;
            background: linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%);
            border-bottom: 1px solid #bae6fd;
            border-top: 1px solid #e2e8f0;
            flex-shrink: 0;
            animation: fadeInModal 0.2s ease-out;
        }
        .tuluan-dapan-full-strip.strip-locked {
            background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%) !important;
            border-bottom-color: #fde68a !important;
        }
        .dapan-strip-content {
            display: flex;
            align-items: center;
            gap: 6px;
            min-width: 0;
            flex: 1;
            flex-wrap: wrap;
        }
        .dapan-badge-new {
            background: #0284c7;
            color: #ffffff;
            font-size: 10px;
            font-weight: 900;
            padding: 2px 7px;
            border-radius: 6px;
            letter-spacing: 0.5px;
            flex-shrink: 0;
        }
        .dapan-badge-new.badge-lock {
            background: #ea580c !important;
        }
        .dapan-strip-title {
            font-size: 12.5px;
            font-weight: 800;
            color: #0369a1;
            text-decoration: none;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .dapan-strip-title:hover {
            text-decoration: underline;
            color: #0284c7;
        }
        .dapan-strip-time {
            font-size: 11.5px;
            color: #64748b;
            font-weight: 700;
            white-space: nowrap;
        }
        .btn-open-dapan-strip {
            background: #0284c7;
            color: #ffffff !important;
            border-radius: 6px;
            padding: 3px 8px;
            font-size: 11px;
            font-weight: 800;
            text-decoration: none;
            white-space: nowrap;
            transition: 0.15s;
        }
        .btn-open-dapan-strip:hover {
            filter: brightness(1.1);
        }
        .btn-open-dapan-strip.disabled-strip {
            background: #cbd5e1 !important;
            color: #64748b !important;
            cursor: not-allowed !important;
            pointer-events: none !important;
        }
        .btn-del-dapan-strip {
            background: #fee2e2;
            color: #dc2626;
            border: 1px solid #fca5a5;
            border-radius: 6px;
            padding: 3px 6px;
            font-size: 11px;
            font-weight: 800;
            cursor: pointer;
            transition: 0.15s;
        }
        .btn-del-dapan-strip:hover {
            background: #dc2626;
            color: #ffffff;
        }

        /* NÚT XÓA ĐỀ THI: MẶC ĐỊNH ẨN, CHỈ HIỆN KHI ADMIN ĐĂNG NHẬP */
        .btn-del-exam-selector {
            background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%) !important;
            color: #dc2626 !important;
            border: 1.5px solid #f87171 !important;
            border-radius: 7px !important;
            padding: 4px 9px !important;
            height: 30px !important;
            font-size: 11.5px !important;
            font-weight: 800 !important;
            cursor: pointer !important;
            display: none;
            align-items: center !important;
            justify-content: center !important;
            gap: 3px !important;
            transition: all 0.16s ease !important;
            flex-shrink: 0 !important;
            box-shadow: 0 2px 6px rgba(220, 38, 38, 0.18) !important;
            user-select: none !important;
            white-space: nowrap !important;
        }
        .btn-del-exam-selector:hover {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
            color: #ffffff !important;
            border-color: #dc2626 !important;
            transform: translateY(-1px) scale(1.03) !important;
            box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3) !important;
        }
        .btn-del-exam-selector:active {
            transform: translateY(2px) scale(0.95) !important;
        }

        /* NÚT XUẤT EXCEL TỰ LUẬN */
        .btn-tuluan-export-excel {
            background: linear-gradient(135deg, #059669 0%, #047857 100%) !important;
            color: #ffffff !important;
            border: 1.2px solid #34d399 !important;
            border-radius: 7px !important;
            padding: 4px 11px !important;
            font-size: 11px !important;
            font-weight: 800 !important;
            cursor: pointer !important;
            height: 30px !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 4px !important;
            transition: all 0.15s ease !important;
            box-shadow: 0 2px 6px rgba(5, 150, 105, 0.25) !important;
            white-space: nowrap !important;
            user-select: none !important;
        }
        .btn-tuluan-export-excel:hover {
            filter: brightness(1.12) !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 4px 10px rgba(5, 150, 105, 0.35) !important;
        }
        .btn-tuluan-export-excel:active {
            transform: translateY(2px) scale(0.96) !important;
        }

        /* Ô NHẬP ĐIỂM CHẤM CHÉO NHAU */
        .tuluan-score-input {
            width: 76px !important;
            padding: 5px 6px !important;
            border: 1.5px solid #cbd5e1 !important;
            border-radius: 8px !important;
            font-size: 13px !important;
            font-weight: 900 !important;
            text-align: center !important;
            outline: none !important;
            color: #0284c7 !important;
            background: #ffffff !important;
            box-sizing: border-box !important;
            transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease !important;
            cursor: pointer !important;
        }
        .tuluan-score-input:hover {
            border-color: #0284c7 !important;
            background: #f0f9ff !important;
        }
        .tuluan-score-input:focus {
            border-color: #0284c7 !important;
            box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.2) !important;
            background: #f0f9ff !important;
            cursor: text !important;
        }

        /* NÚT BẬT NHẬN XÉT */
        .btn-tuluan-comment {
            background: #f8fafc !important;
            color: #475569 !important;
            border: 1.2px solid #cbd5e1 !important;
            border-radius: 8px !important;
            padding: 5px 9px !important;
            font-size: 11px !important;
            font-weight: 800 !important;
            cursor: pointer !important;
            transition: all 0.15s ease !important;
            white-space: nowrap !important;
            display: inline-flex !important;
            align-items: center !important;
            gap: 3px !important;
        }
        .btn-tuluan-comment:hover {
            background: #e0f2fe !important;
            color: #0284c7 !important;
            border-color: #7dd3fc !important;
        }
        .btn-tuluan-comment.active {
            background: #fef3c7 !important;
            color: #b45309 !important;
            border-color: #fde68a !important;
            font-weight: 900 !important;
        }

        /* KHUNG NHẬN XÉT XÒE RA PHÍA TRÊN */
        .student-feedback-popover {
            display: none;
            position: absolute !important;
            right: 0 !important;
            bottom: calc(100% + 6px) !important;
            top: auto !important;
            width: 300px !important;
            background: #ffffff !important;
            border: 1.5px solid #d97706 !important;
            border-radius: 14px !important;
            padding: 12px 14px !important;
            box-shadow: 0 16px 40px rgba(15, 23, 42, 0.35), 0 0 0 1px rgba(217, 119, 6, 0.2) !important;
            z-index: 100000 !important;
            text-align: left !important;
            animation: popInBadge 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .student-feedback-popover.show {
            display: block !important;
        }
        .feedback-textarea {
            width: 100% !important;
            padding: 8px 10px !important;
            border: 1.2px solid #cbd5e1 !important;
            border-radius: 8px !important;
            font-size: 12.5px !important;
            font-family: inherit !important;
            font-weight: 600 !important;
            color: #0f172a !important;
            outline: none !important;
            resize: vertical !important;
            box-sizing: border-box !important;
            margin-bottom: 6px !important;
        }
        .feedback-textarea:focus {
            border-color: #d97706 !important;
            box-shadow: 0 0 0 2px rgba(217, 119, 6, 0.15) !important;
        }

        /* NHÓM NÚT TRONG CỘT THAO TÁC */
        .tuluan-action-btn-group {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 5px !important;
            flex-wrap: nowrap !important;
        }

        /* NÚT ĐỔI MẬT KHẨU */
        .btn-tuluan-change-pass {
            background: #f0fdf4 !important;
            color: #166534 !important;
            border: 1px solid #86efac !important;
            border-radius: 8px !important;
            padding: 6px 9px !important;
            font-size: 11px !important;
            font-weight: 800 !important;
            cursor: pointer !important;
            transition: all 0.15s ease !important;
            white-space: nowrap !important;
            display: inline-flex !important;
            align-items: center !important;
            gap: 3px !important;
            box-shadow: 0 1px 3px rgba(22, 101, 52, 0.1) !important;
        }
        .btn-tuluan-change-pass:hover {
            background: #16a34a !important;
            color: #ffffff !important;
            border-color: #16a34a !important;
            transform: translateY(-1px) !important;
        }
        .btn-tuluan-change-pass:active {
            transform: scale(0.95) !important;
        }

        /* NÚT RESET MẬT KHẨU (ADMIN) */
        .btn-tuluan-reset-pass {
            background: #fff7ed !important;
            color: #c2410c !important;
            border: 1px solid #fdba74 !important;
            border-radius: 8px !important;
            padding: 6px 8px !important;
            font-size: 11px !important;
            font-weight: 800 !important;
            cursor: pointer !important;
            transition: all 0.15s ease !important;
            white-space: nowrap !important;
            display: inline-flex !important;
            align-items: center !important;
            gap: 2px !important;
            box-shadow: 0 1px 3px rgba(194, 65, 12, 0.1) !important;
        }
        .btn-tuluan-reset-pass:hover {
            background: #ea580c !important;
            color: #ffffff !important;
            border-color: #ea580c !important;
            transform: translateY(-1px) !important;
        }
        .btn-tuluan-reset-pass:active {
            transform: scale(0.95) !important;
        }

        /* ĐẨY Z-INDEX CỦA Ô & HÀNG CHỨA POPOVER LÊN CAO NHẤT */
        .tuluan-td-active-popover,
        .tuluan-table tbody td.tuluan-td-active-popover,
        .tuluan-table tbody td:has(.student-pass-popover.show),
        .tuluan-table tbody td:has(.student-feedback-popover.show),
        .tuluan-table tbody td:has(.dapan-schedule-popover.show) {
            z-index: 99999 !important;
            position: relative !important;
        }
        .tuluan-table tbody tr:has(.student-pass-popover.show),
        .tuluan-table tbody tr:has(.student-feedback-popover.show),
        .tuluan-table tbody tr:has(.dapan-schedule-popover.show) {
            z-index: 99999 !important;
            position: relative !important;
        }

        /* KHUNG ĐỔI MẬT KHẨU XÒE RA PHÍA TRÊN & LUÔN NỔI PHÍA TRƯỚC */
        .student-pass-popover {
            display: none;
            position: absolute !important;
            right: 4px !important;
            bottom: calc(100% + 6px) !important;
            top: auto !important;
            width: 280px !important;
            background: #ffffff !important;
            border: 1.5px solid #0284c7 !important;
            border-radius: 14px !important;
            padding: 12px 14px !important;
            box-shadow: 0 16px 40px rgba(15, 23, 42, 0.35), 0 0 0 1px rgba(2, 132, 199, 0.2) !important;
            z-index: 100000 !important;
            text-align: left !important;
            animation: popInBadge 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .student-pass-popover.show {
            display: block !important;
        }
        .pass-popover-header {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            font-size: 12.5px !important;
            font-weight: 900 !important;
            color: #0f172a !important;
            border-bottom: 1px solid #f1f5f9 !important;
            padding-bottom: 6px !important;
            margin-bottom: 8px !important;
        }
        .btn-close-pass-pop {
            background: none !important;
            border: none !important;
            font-size: 14px !important;
            font-weight: 900 !important;
            color: #94a3b8 !important;
            cursor: pointer !important;
            padding: 0 4px !important;
        }
        .btn-close-pass-pop:hover {
            color: #ef4444 !important;
        }
        .pass-popover-hint {
            font-size: 11px !important;
            color: #475569 !important;
            background: #f0f9ff !important;
            border: 1px solid #bae6fd !important;
            padding: 6px 8px !important;
            border-radius: 8px !important;
            margin-bottom: 9px !important;
            line-height: 1.4 !important;
        }
        .pass-input-row {
            margin-bottom: 8px !important;
        }
        .pass-input-row label {
            display: block !important;
            font-size: 11px !important;
            font-weight: 800 !important;
            color: #334155 !important;
            margin-bottom: 3px !important;
        }
        .pass-input-row input {
            width: 100% !important;
            padding: 6px 9px !important;
            border: 1.2px solid #cbd5e1 !important;
            border-radius: 7px !important;
            font-size: 13px !important;
            font-weight: 700 !important;
            outline: none !important;
            box-sizing: border-box !important;
            color: #0f172a !important;
            letter-spacing: 1px !important;
        }
        .pass-input-row input:focus {
            border-color: #0284c7 !important;
            box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.15) !important;
        }
        .pass-popover-actions {
            display: flex !important;
            gap: 6px !important;
            margin-top: 10px !important;
        }
        .btn-pass-cancel {
            flex: 1 !important;
            padding: 6px !important;
            background: #f1f5f9 !important;
            border: 1px solid #cbd5e1 !important;
            border-radius: 7px !important;
            font-size: 11.5px !important;
            font-weight: 800 !important;
            color: #475569 !important;
            cursor: pointer !important;
        }
        .btn-pass-save {
            flex: 1.5 !important;
            padding: 6px !important;
            background: linear-gradient(135deg, #16a34a, #15803d) !important;
            border: none !important;
            border-radius: 7px !important;
            font-size: 11.5px !important;
            font-weight: 800 !important;
            color: #ffffff !important;
            cursor: pointer !important;
            box-shadow: 0 2px 5px rgba(22, 163, 74, 0.25) !important;
        }
    `;
    document.head.appendChild(style);
})();

let currentTuLuanModalData = {
    classId: "lop-11a",
    quizId: "",
    examTitle: "",
    submissionsMap: {},
    availableExams: [],
    customPasswords: {},
    statusFilter: "all",
    dapAnCham: null
};

let tuLuanRealtimeChannel = null;

// HÀM LẤY CLIENT SUPABASE CHÍNH THỨC
function getDbClient() {
    if (typeof getSupabaseClient === 'function') {
        const c = getSupabaseClient();
        if (c) return c;
    }
    if (typeof supabaseClient !== 'undefined' && supabaseClient) return supabaseClient;
    if (typeof window.supabaseClient !== 'undefined' && window.supabaseClient) return window.supabaseClient;
    return null;
}

// Kiểm tra quyền Admin
function checkCurrentIsAdmin() {
    if (typeof isAdminLoggedIn !== 'undefined' && isAdminLoggedIn) return true;
    if (typeof checkAdminSessionValidity === 'function' && checkAdminSessionValidity()) return true;
    try {
        if (typeof safeLocal !== 'undefined') {
            const logged = safeLocal.getItem("adminLoggedInSession");
            const exp = safeLocal.getItem("admin_expires_at");
            if (logged === "true" && exp && Date.now() < parseInt(exp, 10)) {
                return true;
            }
        }
    } catch(e) {}
    return false;
}

// Chuẩn hóa tên lớp thành tên thư mục Google Drive (11C, 11A, 10P, 11E...)
function getCleanDriveClassName(rawClass) {
    if (!rawClass) return "11A";
    let str = String(rawClass).trim().toLowerCase();

    if (str.includes("11c")) return "11C";
    if (str.includes("11a") && !str.includes("hsg")) return "11A";
    if (str.includes("10p")) return "10P";
    if (str.includes("11e")) return "11E";
    if (str.includes("hsg")) return "HSG_TOAN_11";
    if (str.includes("them-11") || str.includes("them 11")) return "THEM_11";
    if (str.includes("them-10") || str.includes("them 10")) return "THEM_10";
    if (str.includes("them-12") || str.includes("them 12")) return "THEM_12";

    str = str.replace(/^(?:lớp|lop)[_\-\s]*/i, "");
    str = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
    str = str.replace(/[^a-zA-Z0-9]/g, "_").replace(/_+/g, "_").trim().toUpperCase();
    return str || "11A";
}

// Chuẩn hóa tên thư mục đề thi trên Google Drive
function getUnifiedExamFolderKey(title, maDe, quizId) {
    let key = (title || maDe || quizId || "BAI_TAP_TU_LUAN").trim();
    return key
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[đĐ]/g, "d")
        .replace(/[\\\/\:\*\?\"<>\|]/g, '_')
        .replace(/\s+/g, '_')
        .replace(/_+/g, '_');
}

// Chuẩn hóa tên thư mục học sinh
function getStudentFolderKey(stt, sbd, name, categoryId = "") {
    let finalStt = stt;
    const cleanSbd = String(sbd || "").trim();
    const cleanName = String(name || "").trim();

    if (window.STUDENT_ACCOUNTS) {
        let found = null;
        if (categoryId) {
            const list = (typeof getAccountsForCategory === 'function') 
                ? getAccountsForCategory(categoryId) 
                : window.STUDENT_ACCOUNTS[categoryId];
            if (Array.isArray(list)) {
                found = list.find(a => 
                    (cleanSbd && String(a.sbd || "").trim().toLowerCase() === cleanSbd.toLowerCase()) ||
                    (cleanName && typeof normalizeName === 'function' && normalizeName(a.name) === normalizeName(cleanName))
                );
            }
        }
        if (!found) {
            for (let cat in window.STUDENT_ACCOUNTS) {
                const list = window.STUDENT_ACCOUNTS[cat];
                if (Array.isArray(list)) {
                    found = list.find(a => 
                        (cleanSbd && String(a.sbd || "").trim().toLowerCase() === cleanSbd.toLowerCase()) ||
                        (cleanName && typeof normalizeName === 'function' && normalizeName(a.name) === normalizeName(cleanName))
                    );
                    if (found) break;
                }
            }
        }
        if (found && found.stt !== undefined && found.stt !== null) {
            finalStt = found.stt;
        }
    }

    if (!finalStt || finalStt === "0" || finalStt === "00" || isNaN(parseInt(finalStt, 10))) {
        finalStt = (finalStt && !isNaN(parseInt(finalStt, 10))) ? finalStt : "00";
    }

    const padStt = String(finalStt).padStart(2, '0');
    const safeSbd = cleanSbd.replace(/[^a-zA-Z0-9]/g, '_') || "NOSBD";
    const safeName = cleanName
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[đĐ]/g, "d")
        .replace(/[^a-zA-Z0-9]/g, '_')
        .replace(/_+/g, '_')
        .toUpperCase() || "HOC_SINH";

    return `${padStt}_${safeSbd}_${safeName}`;
}

// LẤY MẬT KHẨU HIỆN TẠI CỦA HỌC SINH
function getEffectiveStudentPassword(cleanSbd, defaultSbd, defaultPass) {
    const customPass = currentTuLuanModalData.customPasswords && currentTuLuanModalData.customPasswords[cleanSbd];
    if (customPass && String(customPass).trim() !== "") {
        return String(customPass).trim();
    }
    return String(defaultSbd || defaultPass || "").trim();
}

// HÀM NHẬN DIỆN DANH TÍNH NGƯỜI ĐANG NHẬP ĐIỂM CHẤM CHÉO
function getCurrentGraderInfo() {
    if (checkCurrentIsAdmin()) {
        return { name: "Giáo viên (Admin)", sbd: "ADMIN" };
    }

    try {
        const raw = safeLocal.getItem("current_exam_student");
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && (parsed.name || parsed.sbd)) {
                return { name: parsed.name || parsed.sbd, sbd: parsed.sbd || "" };
            }
        }
    } catch(e) {}

    const sName = safeLocal.getItem("saved_student_name");
    const sSbd = safeLocal.getItem("saved_student_sbd");
    if (sName || sSbd) {
        return { name: sName || sSbd, sbd: sSbd || "" };
    }

    const sessionGrader = safeSession.getItem("current_peer_grader");
    if (sessionGrader) {
        try { return JSON.parse(sessionGrader); } catch(e) {}
    }

    const inputIdentify = prompt("👤 NHẬP DANH TÍNH NGƯỜI CHẤM:\n\nVui lòng nhập Họ tên hoặc SBD của em để hệ thống ghi nhận người chấm chéo bài này (Ví dụ: 11A01 hoặc LƯỜNG HẢI AN):");
    if (inputIdentify && inputIdentify.trim()) {
        const cleanInput = inputIdentify.trim();
        const classStudents = (typeof getAccountsForCategory === 'function') 
            ? getAccountsForCategory(currentTuLuanModalData.classId) 
            : [];
        const matched = classStudents.find(st => 
            String(st.sbd).toLowerCase() === cleanInput.toLowerCase() ||
            (typeof normalizeName === 'function' && normalizeName(st.name) === normalizeName(cleanInput))
        );
        const graderObj = matched 
            ? { name: matched.name, sbd: matched.sbd }
            : { name: cleanInput, sbd: "" };
        
        safeSession.setItem("current_peer_grader", JSON.stringify(graderObj));
        return graderObj;
    }

    return { name: "Học sinh trong lớp", sbd: "" };
}

// Nén ảnh tải lên
function compressImageForTuLuanAsync(file, maxDimension = 2048, quality = 0.82) {
    return new Promise((resolve, reject) => {
        if (!file) return reject(new Error("Không tìm thấy tệp được chọn!"));

        const mime = String(file.type || "").toLowerCase();
        const name = String(file.name || "").toLowerCase();
        const isImageMime = mime.startsWith("image/");
        const isImageExt = /\.(jpe?g|png|webp|bmp|gif|heic|heif|jfif|svg)$/i.test(name);

        if (!isImageMime && !isImageExt && mime !== "" && mime !== "application/octet-stream") {
            return reject(new Error("Tệp chọn không phải là hình ảnh!"));
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                try {
                    let width = img.width || 1200;
                    let height = img.height || 900;
                    if (width > maxDimension || height > maxDimension) {
                        if (width > height) {
                            height = Math.round((height * maxDimension) / width);
                            width = maxDimension;
                        } else {
                            width = Math.round((width * maxDimension) / height);
                            height = maxDimension;
                        }
                    }
                    const canvas = document.createElement("canvas");
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext("2d");
                    ctx.fillStyle = "#ffffff";
                    ctx.fillRect(0, 0, width, height);
                    ctx.drawImage(img, 0, 0, width, height);

                    const dataUrl = canvas.toDataURL("image/jpeg", quality);
                    const base64 = dataUrl.split(",")[1];
                    resolve({ base64, dataUrl, mimeType: "image/jpeg" });
                } catch(canvasErr) {
                    let rawResult = String(e.target.result || "");
                    let base64 = rawResult.includes("base64,") ? rawResult.split("base64,")[1] : rawResult;
                    resolve({ base64, dataUrl: rawResult, mimeType: file.type || "image/jpeg" });
                }
            };
            img.onerror = function() {
                let rawResult = String(e.target.result || "");
                if (rawResult.includes("base64,")) {
                    let base64 = rawResult.split("base64,")[1];
                    resolve({ base64, dataUrl: rawResult, mimeType: file.type || "image/jpeg" });
                } else {
                    reject(new Error("Không thể giải mã tệp ảnh này. Vui lòng chọn ảnh chụp JPG/PNG!"));
                }
            };
            img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error("Lỗi đọc tệp từ thiết bị!"));
        reader.readAsDataURL(file);
    });
}

// Gửi file lên Google Drive có retry
async function sendToGoogleDriveWithRetry(gasUrl, payload, maxRetries = 2, timeoutMs = 75000) {
    let lastError = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const controller = new AbortController();
        const timer = setTimeout(() => {
            try { controller.abort(); } catch(e) {}
        }, timeoutMs);

        try {
            const res = await fetch(gasUrl, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify(payload),
                signal: controller.signal
            });
            clearTimeout(timer);
            const result = await res.json();
            if (result && result.status === "success") {
                return result;
            }
            throw new Error(result.message || "Máy chủ Drive không phản hồi đường dẫn tệp.");
        } catch(err) {
            clearTimeout(timer);
            lastError = err;
            if (err.name === 'AbortError' || String(err.message).includes('abort')) {
                lastError = new Error(`Thời gian tải lên Drive quá ${timeoutMs / 1000}s.`);
            }
            if (attempt < maxRetries) {
                await new Promise(r => setTimeout(r, 1500));
            }
        }
    }
    throw lastError;
}

function ensureTuLuanModalDOM() {
    if (document.getElementById("modal-tuluan-submission")) return;
    const modalDiv = document.createElement("div");
    modalDiv.id = "modal-tuluan-submission";
    modalDiv.className = "move-modal-overlay";
    modalDiv.innerHTML = `
        <div class="tuluan-modal-card" onclick="event.stopPropagation()">
            <!-- HEADER -->
            <div class="tuluan-modal-header">
                <div class="tuluan-header-title-box">
                    <span class="tuluan-icon-badge">📁</span>
                    <div>
                        <h3 id="tuluan-modal-heading" style="margin:0; color:#0f172a; font-size:14px; font-weight:900;">📤 NỘP BÀI TỰ LUẬN GOOGLE DRIVE</h3>
                        <div id="tuluan-modal-subheading" style="font-size:11px; color:#64748b; font-weight:700; margin-top:1px;">
                            Thư mục Drive: <code id="tuluan-drive-folder-path" style="color:#0284c7; background:#e0f2fe; padding:2px 6px; border-radius:6px;">BAI_TAP_TU_LUAN</code>
                        </div>
                    </div>
                </div>
                <button type="button" class="btn-close-cleanup-modal" onclick="closeTuLuanModal(event)">✕</button>
            </div>

            <!-- THANH ĐIỀU HƯỚNG CHỌN LỚP (SIÊU BÉ), NÚT UP ĐÁP ÁN, NÚT HẸN GIỜ, CHỌN ĐỀ (RỘNG) & CÔNG CỤ ADMIN -->
            <div class="tuluan-select-bar">
                <!-- 1. NÚT LỚP THU GỌN SIÊU BÉ -->
                <div class="tuluan-select-group" style="flex-shrink:0;">
                    <label style="font-size:11px; font-weight:800; color:#334155;">🏫 Lớp:</label>
                    <select id="tuluan-class-selector" onchange="onTuLuanClassChanged(this.value)" class="tuluan-class-compact-select" title="Chọn lớp">
                        <option value="lop-11a">11A</option>
                        <option value="lop-11c">11C</option>
                        <option value="lop-10p">10P</option>
                        <option value="lop-11e">11E</option>
                        <option value="them-11">Thêm 11</option>
                        <option value="them-10">Thêm 10</option>
                        <option value="them-12">Thêm 12</option>
                        <option value="hsg-toan-11">HSG 11</option>
                    </select>
                </div>

                <!-- 2. NÚT UPLOAD & NÚT HẸN GIỜ ĐÁP ÁN CHẤM BÊN PHẢI NÚT LỚP (SIÊU GỌN GÀNG) -->
                <div class="tuluan-dapan-mini-box" id="tuluan-dapan-mini-box">
                    <input type="file" id="tuluan-dapan-file-input" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.zip,.rar,.xlsx" style="display:none;" onchange="handleUploadDapAnCham(this)">
                    <button type="button" class="btn-tuluan-upload-dapan" id="btn-up-dapan-cham" onclick="triggerUploadDapAnCham(event)" title="Tải file Đáp án chấm tự luận lên Drive/Dap_an_cham_tu_luan">
                        📤 Đ.Á chấm
                    </button>

                    <!-- NÚT HẸN GIỜ MỞ ĐÁP ÁN TỰ ĐỘNG -->
                    <div style="position:relative; display:inline-block;" id="box-schedule-dapan-wrap">
                        <button type="button" class="btn-tuluan-schedule-dapan" id="btn-schedule-dapan" onclick="toggleDapAnSchedulePopover(event)" title="Hẹn giờ tự động mở đáp án cho học sinh">
                            ⏰ Hẹn giờ
                        </button>

                        <!-- POPOVER CẤU HÌNH HẸN GIỜ XÒE RA -->
                        <div class="dapan-schedule-popover" id="dapan-schedule-popover" onclick="event.stopPropagation()">
                            <div class="pass-popover-header">
                                <span>⏰ Hẹn Giờ Mở Đáp Án Chấm</span>
                                <button type="button" class="btn-close-pass-pop" onclick="closeDapAnSchedulePopover(event)">✕</button>
                            </div>
                            <div style="font-size:11px; color:#64748b; margin-bottom:8px; line-height:1.4;">
                                Cài đặt thời điểm học sinh được phép xem đáp án. Trước thời điểm này, đáp án sẽ tự động khóa để bảo mật.
                            </div>

                            <label class="dapan-sched-radio-item">
                                <input type="radio" name="dapan-sched-mode" id="sched-mode-now" value="now" checked onchange="onDapAnScheduleModeChanged('now')">
                                <span>🔓 Mở ngay lập tức (Học sinh xem được luôn)</span>
                            </label>

                            <label class="dapan-sched-radio-item">
                                <input type="radio" name="dapan-sched-mode" id="sched-mode-auto" value="auto" onchange="onDapAnScheduleModeChanged('auto')">
                                <span>⏰ Tự động mở vào ngày & giờ quy định:</span>
                            </label>

                            <div id="sched-datetime-input-group" style="display:none; padding-left:20px; margin-bottom:8px;">
                                <input type="datetime-local" id="dapan-sched-datetime" class="dapan-sched-input">
                                <button type="button" class="btn-quick-deadline" onclick="setScheduleToExamDeadline()">
                                    ⚡ Lấy giờ đóng đề thi
                                </button>
                            </div>

                            <div class="pass-popover-actions">
                                <button type="button" class="btn-pass-cancel" onclick="closeDapAnSchedulePopover(event)">Hủy</button>
                                <button type="button" class="btn-pass-save" style="background:linear-gradient(135deg, #f59e0b, #d97706);" onclick="saveDapAnSchedule(event)">💾 Lưu hẹn giờ</button>
                            </div>
                        </div>
                    </div>

                    <!-- BADGE HIỂN THỊ LINK ĐÁP ÁN MINI -->
                    <div id="tuluan-dapan-badge-wrap" style="display:none; align-items:center; gap:3px;">
                        <a id="tuluan-dapan-badge-link" href="#" target="_blank" class="btn-dapan-badge-active" title="Mở file đáp án chấm">
                            <span class="badge-moi-mini" id="badge-moi-mini-text">MỚI</span>
                            <span id="tuluan-dapan-badge-filename" class="dapan-filename-truncate">Đáp án</span>
                        </a>
                        <button type="button" class="btn-del-dapan-mini" id="btn-del-dapan-mini" style="display:none;" onclick="deleteDapAnCham(event)" title="Xóa file đáp án chấm này">✕</button>
                    </div>
                </div>

                <!-- 3. CHỌN ĐỀ THI DÀNH KHÔNG GIAN TỐI ĐA -->
                <div class="tuluan-select-group" style="flex:1; min-width:180px;">
                    <label style="font-size:11px; font-weight:800; color:#334155;">📝 Chọn đề (5 đề mới nhất):</label>
                    <div style="display:flex; align-items:center; gap:4px; width:100%;">
                        <select id="tuluan-exam-selector" onchange="onTuLuanExamChanged(this.value)" style="flex:1; min-width: 130px;"></select>
                        <!-- NÚT XÓA ĐỀ: CHỈ HIỆN KHI ADMIN ĐĂNG NHẬP -->
                        <button type="button" class="btn-del-exam-selector" id="btn-del-current-exam" style="display:none;" onclick="deleteCurrentTuLuanExam(event)" title="Xóa đề này khỏi danh sách đề tự luận">
                            🗑️ Xóa đề
                        </button>
                    </div>
                </div>

                <!-- 4. CÔNG CỤ ADMIN -->
                <div id="tuluan-admin-add-exam-box" style="display:none; align-items:center; gap:4px; flex-wrap:wrap;">
                    <button type="button" class="btn-tuluan-add-exam" onclick="promptAddNewTuLuanExam()">
                        ➕ Thêm đề
                    </button>
                    <button type="button" class="btn-tuluan-approve-all" onclick="toggleApproveAllSubmissions(true)" title="Duyệt tất cả bài làm của đề này để học sinh cùng xem">
                        ✅ Duyệt hết
                    </button>
                    <button type="button" class="btn-tuluan-export-excel" onclick="exportTuLuanToExcel(event)" title="Xuất toàn bộ bảng điểm, nhận xét và ảnh bài làm đã nộp ra file Excel (.xls) chuẩn đẹp">
                        📊 Xuất excel
                    </button>
                </div>
            </div>

            <!-- DÒNG HIỂN THỊ CHI TIẾT ĐÁP ÁN CHẤM PHONG CÁCH BÁO DÂN TRÍ NHƯ ẢNH CHỤP CỦA THẦY -->
            <div id="tuluan-dapan-full-strip" class="tuluan-dapan-full-strip" style="display:none;">
                <div class="dapan-strip-content">
                    <span class="dapan-badge-new" id="strip-dapan-badge-tag">MỚI</span>
                    <a id="strip-dapan-link" href="#" target="_blank" class="dapan-strip-title" title="Bấm vào để mở xem file Đáp án chấm">
                        ĐÁP ÁN: <span id="strip-dapan-filename">...</span>
                    </a>
                    <span class="dapan-strip-time" id="strip-dapan-time">📅 ...</span>
                </div>
                <div style="display:flex; align-items:center; gap:6px;">
                    <a id="strip-dapan-open-btn" href="#" target="_blank" class="btn-open-dapan-strip">🔗 Mở xem</a>
                    <button type="button" id="strip-dapan-del-btn" class="btn-del-dapan-strip" style="display:none;" onclick="deleteDapAnCham(event)" title="Xóa file đáp án này">🗑️ Xóa</button>
                </div>
            </div>

            <!-- TOOLBAR LỌC & TÌM KIẾM -->
            <div class="tuluan-toolbar-bar">
                <input type="text" id="tuluan-search-student" class="tuluan-search-box" placeholder="🔍 Tìm tên hoặc SBD..." oninput="filterTuLuanStudentTable()">
                <div class="tuluan-filter-tabs">
                    <button type="button" class="tuluan-tab-pill active" id="tab-filter-all" onclick="filterTuLuanStatus('all')">Tất cả (<span id="count-all-st">0</span>)</button>
                    <button type="button" class="tuluan-tab-pill" id="tab-filter-submitted" onclick="filterTuLuanStatus('submitted')">✅ Đã nộp (<span id="count-sub-st">0</span>)</button>
                    <button type="button" class="tuluan-tab-pill" id="tab-filter-pending" onclick="filterTuLuanStatus('pending')">⏳ Chưa nộp (<span id="count-pen-st">0</span>)</button>
                </div>
            </div>

            <!-- BẢNG DANH SÁCH HỌC SINH -->
            <div class="tuluan-table-wrap">
                <table class="tuluan-table">
                    <thead>
                        <tr>
                            <th style="width: 42px; text-align: center;">STT</th>
                            <th style="width: 155px;">Họ và tên</th>
                            <th style="width: 75px; text-align: center;">SBD</th>
                            <th style="width: 140px;">Trạng thái / Ngày nộp</th>
                            <th style="width: 105px; text-align: center;">Phê duyệt</th>
                            <th style="min-width: 165px;">Ảnh bài làm đã nộp</th>
                            <!-- CỘT CHẤM CHÉO NHAU (GHI NHẬN DANH TÍNH & HIỆN TOOLTIP KHI RÊ CHUỘT) -->
                            <th style="width: 105px; text-align: center;" title="Nhập điểm chấm chéo bài tự luận (Rê chuột vào ô để xem ai là người chấm)">Chấm chéo nhau</th>
                            <!-- CỘT NHẬN XÉT -->
                            <th style="width: 110px; text-align: center;" title="Bấm vào để xòe ra bảng nhận xét chi tiết bài làm của học sinh">Nhận xét</th>
                            <th style="min-width: 175px; text-align: center;">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody id="tuluan-students-tbody"></tbody>
                </table>
            </div>

            <div class="tuluan-modal-footer">
                <span style="font-size:11.5px; color:#475569; font-style:italic;">
                    🔒 Học sinh chỉ xem được ảnh bài làm phóng to của bạn bè sau khi được Giáo viên phê duyệt. Rê chuột vào ô điểm chấm chéo để xem người đã nhập.
                </span>
                <button type="button" class="btn-admin btn-cancel" style="padding: 6px 18px;" onclick="closeTuLuanModal(event)">Đóng</button>
            </div>
        </div>

        <!-- LIGHTBOX PHÓNG TO ẢNH -->
        <div id="tuluan-lightbox" class="tuluan-lightbox-overlay" onclick="closeTuLuanLightbox(event)">
            <div class="tuluan-lightbox-content" onclick="event.stopPropagation()">
                <div class="tuluan-lightbox-header">
                    <span id="lightbox-student-title" style="font-weight:800; font-size:14px; color:#ffffff;">Ảnh bài làm</span>
                    <div style="display:flex; gap:8px;">
                        <a id="lightbox-drive-link" href="#" target="_blank" class="btn-lightbox-open-drive">🔗 Mở trên Drive</a>
                        <button type="button" class="btn-close-lightbox" onclick="closeTuLuanLightbox(event)">✕</button>
                    </div>
                </div>
                <div class="tuluan-lightbox-img-box">
                    <img id="lightbox-full-img" src="" alt="Ảnh bài làm tự luận">
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modalDiv);
}

// Cập nhật giao diện quản trị Admin
function updateTuLuanAdminUI() {
    const isAdmin = checkCurrentIsAdmin();
    const adminBox = document.getElementById("tuluan-admin-add-exam-box");
    if (adminBox) {
        adminBox.style.setProperty("display", isAdmin ? "flex" : "none", "important");
    }
    const delExamBtn = document.getElementById("btn-del-current-exam");
    if (delExamBtn) {
        delExamBtn.style.setProperty("display", isAdmin ? "inline-flex" : "none", "important");
    }
    const upDapanBtn = document.getElementById("btn-up-dapan-cham");
    if (upDapanBtn) {
        upDapanBtn.style.setProperty("display", isAdmin ? "inline-flex" : "none", "important");
    }
    const schedWrap = document.getElementById("box-schedule-dapan-wrap");
    if (schedWrap) {
        schedWrap.style.setProperty("display", isAdmin ? "inline-block" : "none", "important");
    }
    const delDapanMini = document.getElementById("btn-del-dapan-mini");
    const delDapanStrip = document.getElementById("strip-dapan-del-btn");
    if (delDapanMini) delDapanMini.style.display = isAdmin ? "inline-flex" : "none";
    if (delDapanStrip) delDapanStrip.style.display = isAdmin ? "inline-flex" : "none";
}

// Mở Modal Nộp bài tự luận
async function openTuLuanModal(classId, itemId, event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    ensureTuLuanModalDOM();

    let targetCat = classId;
    if (targetCat === "tu-luan-padlet" || !targetCat) {
        if (itemId && itemId.includes("11c")) targetCat = "lop-11c";
        else if (itemId && itemId.includes("10p")) targetCat = "lop-10p";
        else if (itemId && itemId.includes("11e")) targetCat = "lop-11e";
        else targetCat = "lop-11a";
    }

    currentTuLuanModalData.classId = targetCat;
    const classSelector = document.getElementById("tuluan-class-selector");
    if (classSelector) classSelector.value = targetCat;

    updateTuLuanAdminUI();

    document.getElementById("modal-tuluan-submission").style.display = "flex";
    await refreshTuLuanExamList(targetCat, itemId);
}

function closeTuLuanModal(event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    const modal = document.getElementById("modal-tuluan-submission");
    if (modal) modal.style.display = "none";
    
    // Gỡ kết nối Realtime Supabase khi đóng modal
    if (tuLuanRealtimeChannel) {
        const client = getDbClient();
        if (client) {
            try { client.removeChannel(tuLuanRealtimeChannel); } catch(e) {}
        }
        tuLuanRealtimeChannel = null;
    }
}

// NẠP 5 ĐỀ MỚI NHẤT CỦA ĐÚNG LỚP ĐANG XEM (QUA SUPABASE)
async function refreshTuLuanExamList(targetCat, preferredExamId = null) {
    const selector = document.getElementById("tuluan-exam-selector");
    if (!selector) return;

    currentTuLuanModalData.classId = targetCat;
    selector.innerHTML = "<option value=''>⏳ Đang tải 5 đề mới nhất...</option>";

    let rawExams = [];
    const client = getDbClient();

    // 1. Quét từ Supabase bảng `custom_links` theo category_id
    if (client) {
        try {
            const { data: linksData } = await client
                .from('custom_links')
                .select('*')
                .eq('category_id', targetCat);

            if (Array.isArray(linksData)) {
                linksData.forEach(item => {
                    if (item && item.title && String(item.title).trim() !== "") {
                        let t = item.timestamp || (typeof parseDateString === 'function' ? parseDateString(item.date) : 0) || 0;
                        rawExams.push({
                            id: (typeof extractQuizIdFromItem === 'function') ? (extractQuizIdFromItem(item) || item.id) : item.id,
                            title: item.title,
                            timestamp: t
                        });
                    }
                });
            }
        } catch(e) {
            console.warn("Lỗi tải đề từ Supabase custom_links:", e);
        }
    }

    // 2. Quét dự phòng từ danh mục RAM của ĐÚNG lớp này
    const allCats = [...(window.DAY_THEM_CATEGORIES || []), ...(window.CHINH_KHOA_CATEGORIES || [])];
    const catObj = allCats.find(c => c.id === targetCat);
    if (catObj && Array.isArray(catObj.links)) {
        catObj.links.forEach(l => {
            if (l && l.title && String(l.title).trim() !== "") {
                let t = l.timestamp || (typeof parseDateString === 'function' ? parseDateString(l.date) : 0) || 0;
                rawExams.push({
                    id: (typeof extractQuizIdFromItem === 'function') ? (extractQuizIdFromItem(l) || l.id) : l.id,
                    title: l.title,
                    timestamp: t
                });
            }
        });
    }

    // Sắp xếp giảm dần theo thời gian (đề mới nhất lên đầu)
    rawExams.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    // Lọc trùng lặp theo tên đề thi
    const uniqueExams = [];
    const seenTitles = new Set();
    rawExams.forEach(ex => {
        const norm = ex.title.trim().toLowerCase();
        if (!seenTitles.has(norm)) {
            seenTitles.add(norm);
            uniqueExams.push(ex);
        }
    });

    let top5Exams = uniqueExams.slice(0, 5);

    // Fallback chuẩn theo lớp hiện tại nếu chưa có đề nào
    if (top5Exams.length === 0) {
        const driveClassClean = getCleanDriveClassName(targetCat);
        top5Exams.push({
            id: `DE_TU_LUAN_${driveClassClean}`,
            title: `Đề tự luận ${driveClassClean}`,
            timestamp: Date.now()
        });
    }

    currentTuLuanModalData.availableExams = top5Exams;
    selector.innerHTML = "";

    top5Exams.forEach((ex, idx) => {
        const opt = document.createElement("option");
        opt.value = ex.id;
        opt.innerText = `${idx + 1}. ${ex.title}`;
        opt.dataset.title = ex.title;
        selector.appendChild(opt);
    });

    let selectedExam = top5Exams[0];
    if (preferredExamId) {
        const found = top5Exams.find(e => e.id === preferredExamId || e.title === preferredExamId);
        if (found) selectedExam = found;
    }
    selector.value = selectedExam.id;

    updateTuLuanAdminUI();
    await switchTuLuanExam(selectedExam.id, selectedExam.title);
}

// Chuyển đổi đề thi hiển thị trong Modal
async function switchTuLuanExam(examId, examTitle) {
    const classSelector = document.getElementById("tuluan-class-selector");
    if (classSelector && classSelector.value) {
        currentTuLuanModalData.classId = classSelector.value;
    }

    currentTuLuanModalData.quizId = examId;
    currentTuLuanModalData.examTitle = examTitle;

    const folderKey = getUnifiedExamFolderKey(examTitle, "", examId);
    const driveClassName = getCleanDriveClassName(currentTuLuanModalData.classId);

    const headTitle = document.getElementById("tuluan-modal-heading");
    const pathCode = document.getElementById("tuluan-drive-folder-path");
    if (headTitle) headTitle.innerText = `📤 NỘP BÀI TỰ LUẬN - ${examTitle}`;
    if (pathCode) pathCode.innerText = `BAI_TAP_TU_LUAN / ${driveClassName} / ${folderKey} / [STT_SBD_HỌ_TÊN]`;

    updateTuLuanAdminUI();

    await loadTuLuanSubmissionsFromSupabase();
    renderDapAnChamUI();
    renderTuLuanStudentsTable();
    startTuLuanRealtimeListener(examId);
}

function onTuLuanClassChanged(newClassId) {
    currentTuLuanModalData.classId = newClassId;
    refreshTuLuanExamList(newClassId);
}

function onTuLuanExamChanged(newExamId) {
    const selector = document.getElementById("tuluan-exam-selector");
    const selectedOpt = selector.options[selector.selectedIndex];
    const examTitle = selectedOpt ? selectedOpt.dataset.title : newExamId;
    switchTuLuanExam(newExamId, examTitle);
}

// XÓA ĐỀ THI ĐƯỢC CHỌN KHỎI DANH SÁCH (CHỈ DÀNH CHO ADMIN)
async function deleteCurrentTuLuanExam(event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    if (!checkCurrentIsAdmin()) {
        alert("⛔ Chỉ Giáo viên quản trị mới có quyền xóa đề thi!");
        return;
    }

    const classSelector = document.getElementById("tuluan-class-selector");
    const classId = (classSelector && classSelector.value) ? classSelector.value : (currentTuLuanModalData.classId || "lop-11a");
    const className = getCleanDriveClassName(classId);

    const selector = document.getElementById("tuluan-exam-selector");
    if (!selector || !selector.value) {
        alert("⚠️ Vui lòng chọn một đề để xóa!");
        return;
    }

    const examId = selector.value;
    const selectedOpt = selector.options[selector.selectedIndex];
    let examTitle = selectedOpt ? (selectedOpt.dataset.title || selectedOpt.innerText) : examId;
    examTitle = examTitle.replace(/^\d+\.\s*/, '').trim();

    if (!confirm(`⚠️ XÁC NHẬN XÓA ĐỀ TỰ LUẬN (ADMIN):\n\nThầy có chắc chắn muốn XÓA đề:\n"${examTitle}"\nkhỏi danh sách nộp bài của lớp ${className} không?\n\n(Hệ thống sẽ gỡ bỏ đề này khỏi lớp ${className} và cập nhật tức thì).`)) {
        return;
    }

    const btn = document.getElementById("btn-del-current-exam");
    if (btn) {
        btn.disabled = true;
        btn.innerText = "⏳ Đang xóa...";
    }

    try {
        const client = getDbClient();
        if (client) {
            await Promise.all([
                client.from('custom_links').delete().eq('category_id', classId).eq('id', examId),
                client.from('custom_links').delete().eq('category_id', classId).eq('title', examTitle),
                client.from('tu_luan_submissions').delete().eq('quiz_id', examId),
                client.from('app_key_values').delete().eq('key', 'dapan_' + examId)
            ]);
        }

        const allCats = [...(window.DAY_THEM_CATEGORIES || []), ...(window.CHINH_KHOA_CATEGORIES || [])];
        const catObj = allCats.find(c => c.id === classId);
        if (catObj && Array.isArray(catObj.links)) {
            catObj.links = catObj.links.filter(l => (l.id !== examId && l.firebaseId !== examId && l.title !== examTitle));
        }

        alert(`🗑️ Đã xóa đề "${examTitle}" của lớp ${className} thành công!`);
        await refreshTuLuanExamList(classId);
    } catch(err) {
        alert("❌ Lỗi khi xóa đề: " + err.message);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerText = "🗑️ Xóa đề";
        }
    }
}

// THÊM ĐỀ TỰ LUẬN MỚI
async function promptAddNewTuLuanExam() {
    const inputTitle = prompt("➕ NHẬP TÊN ĐỀ THI TỰ LUẬN MỚI (VD: Đề 109 Giữa Kỳ 1, Đề 108 Toán 11...):");
    if (!inputTitle || !inputTitle.trim()) return;

    const examTitle = inputTitle.trim();
    const classSelector = document.getElementById("tuluan-class-selector");
    const classId = (classSelector && classSelector.value) ? classSelector.value : (currentTuLuanModalData.classId || "lop-11a");
    currentTuLuanModalData.classId = classId;

    const examId = "exam_" + Date.now();
    const folderKey = getUnifiedExamFolderKey(examTitle, "", examId);
    const driveClassName = getCleanDriveClassName(classId);

    try {
        const client = getDbClient();
        if (client) {
            await client.from('custom_links').upsert({
                id: examId,
                category_id: classId,
                title: examTitle,
                is_doc: true,
                badge_text: "MỚI",
                timestamp: Date.now(),
                date: new Date().toLocaleDateString("vi-VN"),
                url: "#"
            });
        }

        const gasUrl = (typeof GOOGLE_DRIVE_TULUAN_GAS_URL !== "undefined" && GOOGLE_DRIVE_TULUAN_GAS_URL) 
            ? GOOGLE_DRIVE_TULUAN_GAS_URL 
            : GOOGLE_DRIVE_UPLOAD_GAS_URL;

        if (gasUrl && !gasUrl.includes("DÁN_URL")) {
            fetch(gasUrl, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({
                    action: "createExamFolders",
                    rootFolder: "BAI_TAP_TU_LUAN",
                    className: driveClassName,
                    class: driveClassName,
                    lop: driveClassName,
                    classList: [driveClassName],
                    examTitle: folderKey,
                    folderKey: folderKey
                })
            }).catch(() => null);
        }

        alert(`✅ Đã thêm đề "${examTitle}" thành công cho lớp ${driveClassName}!\nThư mục tương ứng đã được khởi tạo trên Google Drive 5TB tại: BAI_TAP_TU_LUAN / ${driveClassName} / ${folderKey}`);
        await refreshTuLuanExamList(classId, examId);
    } catch(err) {
        alert("❌ Lỗi khi thêm đề: " + err.message);
    }
}

// ĐỌC DANH SÁCH BÀI NỘP, MẬT KHẨU & ĐÁP ÁN CHẤM TỪ SUPABASE
async function loadTuLuanSubmissionsFromSupabase() {
    const qId = currentTuLuanModalData.quizId;
    if (!qId) return;

    const client = getDbClient();
    if (!client) {
        currentTuLuanModalData.submissionsMap = {};
        currentTuLuanModalData.dapAnCham = null;
        return;
    }

    try {
        const [subsRes, passRes, dapanRes] = await Promise.all([
            client.from('tu_luan_submissions').select('*').eq('quiz_id', qId),
            client.from('app_key_values').select('value').eq('key', 'student_custom_passwords').single(),
            client.from('app_key_values').select('value').eq('key', 'dapan_' + qId).single()
        ]);

        let combined = {};
        if (subsRes && Array.isArray(subsRes.data)) {
            subsRes.data.forEach(row => {
                if (row && row.sbd) {
                    combined[row.sbd] = {
                        stt: row.stt,
                        sbd: row.sbd,
                        studentName: row.student_name,
                        className: row.class_name,
                        examTitle: row.exam_title,
                        lastSubmit: row.last_submit,
                        lastSubmitTime: row.last_submit_time,
                        count: row.count || (Array.isArray(row.images) ? row.images.length : 0),
                        images: Array.isArray(row.images) ? row.images : [],
                        crossScore: row.cross_score || "",
                        crossScoreBy: row.cross_score_by || "",
                        crossScoreTime: row.cross_score_time || "",
                        feedback: row.feedback || "",
                        feedbackTime: row.feedback_time || "",
                        isApproved: !!row.is_approved
                    };
                }
            });
        }
        currentTuLuanModalData.submissionsMap = combined;

        if (passRes && passRes.data && passRes.data.value) {
            currentTuLuanModalData.customPasswords = passRes.data.value;
        } else {
            currentTuLuanModalData.customPasswords = {};
        }

        if (dapanRes && dapanRes.data && dapanRes.data.value && dapanRes.data.value.fileUrl) {
            currentTuLuanModalData.dapAnCham = dapanRes.data.value;
        } else {
            currentTuLuanModalData.dapAnCham = null;
        }
    } catch(e) {
        console.warn("Lỗi đọc dữ liệu tự luận Supabase:", e);
        currentTuLuanModalData.submissionsMap = {};
        currentTuLuanModalData.dapAnCham = null;
    }
}

// BẬT LẮNG NGHE SUPABASE REALTIME CHANNEL ĐỒNG BỘ TỨC THÌ
function startTuLuanRealtimeListener(quizId) {
    const client = getDbClient();
    if (!client || !quizId) return;

    if (tuLuanRealtimeChannel) {
        try { client.removeChannel(tuLuanRealtimeChannel); } catch(e) {}
        tuLuanRealtimeChannel = null;
    }

    try {
        tuLuanRealtimeChannel = client.channel(`tuluan_realtime_${quizId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'tu_luan_submissions',
                filter: `quiz_id=eq.${quizId}`
            }, async () => {
                await loadTuLuanSubmissionsFromSupabase();
                renderDapAnChamUI();
                renderTuLuanStudentsTable();
            })
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'app_key_values',
                filter: `key=eq.dapan_${quizId}`
            }, async () => {
                await loadTuLuanSubmissionsFromSupabase();
                renderDapAnChamUI();
            })
            .subscribe();
    } catch(e) {
        console.warn("Lỗi kết nối Supabase Realtime channel:", e);
    }
}

// =========================================================
// QUẢN LÝ UPLOAD, HẸN GIỜ & HIỂN THỊ ĐÁP ÁN CHẤM LÊN SUPABASE & DRIVE
// =========================================================
function triggerUploadDapAnCham(event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    const fileIn = document.getElementById("tuluan-dapan-file-input");
    if (fileIn) {
        fileIn.value = "";
        fileIn.click();
    }
}

async function handleUploadDapAnCham(fileInput) {
    if (!fileInput.files || fileInput.files.length === 0) return;
    const file = fileInput.files[0];

    const btn = document.getElementById("btn-up-dapan-cham");
    if (btn) {
        btn.disabled = true;
        btn.innerText = "⏳ Đang gửi...";
    }

    const qId = currentTuLuanModalData.quizId || "quiz";
    const classId = currentTuLuanModalData.classId || "lop-11a";

    const gasUrl = (typeof GOOGLE_DRIVE_TULUAN_GAS_URL !== "undefined" && GOOGLE_DRIVE_TULUAN_GAS_URL) 
        ? GOOGLE_DRIVE_TULUAN_GAS_URL 
        : GOOGLE_DRIVE_UPLOAD_GAS_URL;

    if (!gasUrl || gasUrl.includes("DÁN_URL")) {
        alert("⚠️ Chưa cấu hình GOOGLE_DRIVE_TULUAN_GAS_URL trong app-config.js!");
        if (btn) { btn.disabled = false; btn.innerText = "📤 Đ.Á chấm"; }
        return;
    }

    try {
        const reader = new FileReader();
        reader.onload = async function(e) {
            try {
                let rawResult = String(e.target.result || "");
                let base64Data = rawResult.includes("base64,") ? rawResult.split("base64,")[1] : rawResult;

                // Cấu hình đẩy vào thư mục: KHO_TAI_LIEU_PDF_WORD_ANH_VIDEO/Dap_an_cham_tu_luan
                const payload = {
                    action: "uploadDapAnCham",
                    rootFolder: "KHO_TAI_LIEU_PDF_WORD_ANH_VIDEO",
                    className: "Dap_an_cham_tu_luan",
                    class: "Dap_an_cham_tu_luan",
                    lop: "Dap_an_cham_tu_luan",
                    examTitle: "Dap_an_cham_tu_luan",
                    folderKey: "Dap_an_cham_tu_luan",
                    studentFolder: "Dap_an_cham_tu_luan",
                    filename: file.name,
                    mimeType: file.type || "application/octet-stream",
                    base64: base64Data
                };

                const result = await sendToGoogleDriveWithRetry(gasUrl, payload, 2, 75000);
                if (result && result.status === "success" && result.fileUrl) {
                    const now = new Date();
                    const pad = n => String(n).padStart(2, '0');
                    const uploadTimeStr = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} - ${pad(now.getHours())}:${pad(now.getMinutes())}`;

                    const directUrl = result.directUrl || (typeof toDirectGoogleDriveImageUrl === 'function' ? toDirectGoogleDriveImageUrl(result.fileUrl) : result.fileUrl);
                    const existingDapan = currentTuLuanModalData.dapAnCham || {};

                    const dapanData = {
                        quizId: qId,
                        classId: classId,
                        fileName: file.name,
                        fileUrl: result.fileUrl,
                        directUrl: directUrl,
                        fileId: result.fileId || "",
                        uploadedAt: uploadTimeStr,
                        timestamp: Date.now(),
                        scheduleTime: existingDapan.scheduleTime || null // Bảo lưu lịch hẹn giờ nếu đã có
                    };

                    const client = getDbClient();
                    if (client) {
                        await client.from('app_key_values').upsert({
                            key: 'dapan_' + qId,
                            value: dapanData
                        });
                    }

                    currentTuLuanModalData.dapAnCham = dapanData;
                    renderDapAnChamUI();
                    alert(`🎉 ĐÃ TẢI LÊN ĐÁP ÁN CHẤM THÀNH CÔNG!\n\n📁 Tên file: ${file.name}\n📍 Thư mục Drive: KHO_TAI_LIEU_PDF_WORD_ANH_VIDEO / Dap_an_cham_tu_luan\n🕒 Thời gian: ${uploadTimeStr}`);
                } else {
                    throw new Error(result.message || "Không thể lấy đường dẫn tệp từ Google Drive.");
                }
            } catch(upErr) {
                alert("❌ Lỗi khi tải file lên Drive: " + upErr.message);
            } finally {
                if (btn) {
                    btn.disabled = false;
                    btn.innerText = "📤 Đ.Á chấm";
                }
                fileInput.value = "";
            }
        };
        reader.readAsDataURL(file);
    } catch(err) {
        alert("❌ Lỗi đọc file từ máy: " + err.message);
        if (btn) {
            btn.disabled = false;
            btn.innerText = "📤 Đ.Á chấm";
        }
        fileInput.value = "";
    }
}

// Xóa file đáp án chấm qua Supabase
async function deleteDapAnCham(event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    if (!checkCurrentIsAdmin()) {
        alert("⛔ Chỉ Giáo viên quản trị mới có quyền xóa file Đáp án chấm!");
        return;
    }

    if (!confirm("⚠️ Bạn có chắc chắn muốn XÓA file Đáp án chấm của đề này không?")) return;

    const qId = currentTuLuanModalData.quizId;
    const curDapan = currentTuLuanModalData.dapAnCham;

    try {
        const client = getDbClient();
        if (client) {
            await client.from('app_key_values').delete().eq('key', 'dapan_' + qId);
        }

        if (curDapan && curDapan.fileId) {
            const gasUrl = (typeof GOOGLE_DRIVE_TULUAN_GAS_URL !== "undefined" && GOOGLE_DRIVE_TULUAN_GAS_URL) 
                ? GOOGLE_DRIVE_TULUAN_GAS_URL 
                : GOOGLE_DRIVE_UPLOAD_GAS_URL;
            if (gasUrl && !gasUrl.includes("DÁN_URL")) {
                fetch(gasUrl, {
                    method: "POST",
                    headers: { "Content-Type": "text/plain;charset=utf-8" },
                    body: JSON.stringify({ action: "deleteFile", fileId: curDapan.fileId })
                }).catch(() => null);
            }
        }

        currentTuLuanModalData.dapAnCham = null;
        renderDapAnChamUI();
        alert("🗑️ Đã xóa file Đáp án chấm thành công!");
    } catch(err) {
        alert("❌ Lỗi khi xóa: " + err.message);
    }
}

// =========================================================
// CƠ CHẾ HẸN GIỜ MỞ ĐÁP ÁN CHẤM TỰ ĐỘNG THÔNG MINH
// =========================================================
function toggleDapAnSchedulePopover(event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    const pop = document.getElementById("dapan-schedule-popover");
    if (!pop) return;
    const isShown = pop.classList.contains("show");

    document.querySelectorAll(".student-pass-popover.show").forEach(p => p.classList.remove("show"));
    document.querySelectorAll(".student-feedback-popover.show").forEach(p => p.classList.remove("show"));
    document.querySelectorAll(".dapan-schedule-popover.show").forEach(p => p.classList.remove("show"));

    if (!isShown) {
        pop.classList.add("show");

        const curDapan = currentTuLuanModalData.dapAnCham;
        const radioNow = document.getElementById("sched-mode-now");
        const radioAuto = document.getElementById("sched-mode-auto");
        const dateInput = document.getElementById("dapan-sched-datetime");

        if (curDapan && curDapan.scheduleTime) {
            if (radioAuto) radioAuto.checked = true;
            onDapAnScheduleModeChanged('auto');
            if (dateInput) {
                const d = new Date(curDapan.scheduleTime);
                if (!isNaN(d.getTime()) && typeof toLocalDatetimeString === 'function') {
                    dateInput.value = toLocalDatetimeString(d);
                } else if (!isNaN(d.getTime())) {
                    const pad = n => String(n).padStart(2, '0');
                    dateInput.value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                }
            }
        } else {
            if (radioNow) radioNow.checked = true;
            onDapAnScheduleModeChanged('now');
            if (dateInput) dateInput.value = "";
        }
    }
}

function closeDapAnSchedulePopover(event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    const pop = document.getElementById("dapan-schedule-popover");
    if (pop) pop.classList.remove("show");
}

function onDapAnScheduleModeChanged(mode) {
    const inputGroup = document.getElementById("sched-datetime-input-group");
    if (inputGroup) {
        inputGroup.style.display = (mode === 'auto') ? 'block' : 'none';
        if (mode === 'auto') {
            const dateInput = document.getElementById("dapan-sched-datetime");
            if (dateInput && !dateInput.value) {
                setScheduleToExamDeadline();
            }
        }
    }
}

// Tự động trích xuất hạn chót của đề thi hiện tại để hẹn giờ mở đáp án
function setScheduleToExamDeadline() {
    const dateInput = document.getElementById("dapan-sched-datetime");
    if (!dateInput) return;

    let deadlineStr = null;
    const currentQuizId = currentTuLuanModalData.quizId;

    if (typeof examData !== 'undefined' && examData && examData.examEndTimeStr) {
        deadlineStr = examData.examEndTimeStr;
    } else {
        const allCats = [...(window.DAY_THEM_CATEGORIES || []), ...(window.CHINH_KHOA_CATEGORIES || [])];
        for (const cat of allCats) {
            if (Array.isArray(cat.links)) {
                const match = cat.links.find(l => (l.id === currentQuizId || l.firebaseId === currentQuizId));
                if (match && match.examEndTimeStr) {
                    deadlineStr = match.examEndTimeStr;
                    break;
                }
            }
        }
    }

    if (deadlineStr) {
        const d = new Date(deadlineStr);
        if (!isNaN(d.getTime()) && typeof toLocalDatetimeString === 'function') {
            dateInput.value = toLocalDatetimeString(d);
            return;
        }
    }

    // Nếu không có hạn đề thi, mặc định chọn 21h00 ngày hôm nay
    const def = new Date();
    def.setHours(21, 0, 0, 0);
    const pad = n => String(n).padStart(2, '0');
    dateInput.value = `${def.getFullYear()}-${pad(def.getMonth() + 1)}-${pad(def.getDate())}T${pad(def.getHours())}:${pad(def.getMinutes())}`;
}

// Lưu cấu hình hẹn giờ lên Supabase
async function saveDapAnSchedule(event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    const qId = currentTuLuanModalData.quizId;
    if (!qId) return;

    const curDapan = currentTuLuanModalData.dapAnCham;
    if (!curDapan) {
        alert("⚠️ Vui lòng upload file Đáp án chấm trước khi thiết lập lịch hẹn giờ!");
        closeDapAnSchedulePopover();
        return;
    }

    const radioAuto = document.getElementById("sched-mode-auto");
    const isAuto = radioAuto && radioAuto.checked;
    let scheduleTimeISO = null;

    if (isAuto) {
        const dateInput = document.getElementById("dapan-sched-datetime");
        const val = dateInput ? dateInput.value : "";
        if (!val) {
            alert("⚠️ Vui lòng chọn ngày và giờ mở đáp án!");
            return;
        }
        const d = new Date(val);
        if (isNaN(d.getTime())) {
            alert("⚠️ Thời gian hẹn không hợp lệ!");
            return;
        }
        scheduleTimeISO = d.toISOString();
    }

    curDapan.scheduleTime = scheduleTimeISO;

    try {
        const client = getDbClient();
        if (client) {
            await client.from('app_key_values').upsert({
                key: 'dapan_' + qId,
                value: curDapan
            });
        }

        renderDapAnChamUI();
        closeDapAnSchedulePopover();

        if (scheduleTimeISO) {
            const formatted = new Date(scheduleTimeISO).toLocaleString("vi-VN");
            alert(`⏰ ĐÃ THIẾT LẬP HẸN GIỜ MỞ ĐÁP ÁN!\n\n- Đề thi: ${currentTuLuanModalData.examTitle}\n- Thời điểm tự động mở cho học sinh: ${formatted}\n\n(Trước thời điểm này, link đáp án sẽ tự động khóa đối với học sinh, giáo viên vẫn có thể mở xem trước).`);
        } else {
            alert("🔓 Đã mở đáp án tự do cho học sinh xem ngay lập tức!");
        }
    } catch(err) {
        alert("❌ Lỗi khi lưu hẹn giờ: " + err.message);
    }
}

// Kiểm tra đáp án đã đến giờ mở chưa
function isDapAnUnlocked(dapan) {
    if (!dapan || !dapan.fileUrl) return false;
    if (checkCurrentIsAdmin()) return true; // Giáo viên luôn luôn xem được
    if (!dapan.scheduleTime) return true; // Mở ngay lập tức
    const targetMs = new Date(dapan.scheduleTime).getTime();
    if (isNaN(targetMs)) return true;
    return Date.now() >= targetMs;
}

// Định dạng thời gian đếm ngược còn lại
function formatRemainingLockTime(targetMs) {
    const diffSec = Math.max(0, Math.floor((targetMs - Date.now()) / 1000));
    if (diffSec <= 0) return "Đang mở...";
    const days = Math.floor(diffSec / 86400);
    const hours = Math.floor((diffSec % 86400) / 3600);
    const mins = Math.floor((diffSec % 3600) / 60);

    if (days > 0) return `${days} ngày ${hours} giờ`;
    if (hours > 0) return `${hours} giờ ${mins} phút`;
    return `${mins} phút`;
}

// Hiển thị giao diện Đáp án chấm (badge mini và dòng banner phong cách Dân trí)
function renderDapAnChamUI() {
    const dapan = currentTuLuanModalData.dapAnCham;
    const isAdmin = checkCurrentIsAdmin();

    const schedBtn = document.getElementById("btn-schedule-dapan");
    const badgeWrap = document.getElementById("tuluan-dapan-badge-wrap");
    const badgeLink = document.getElementById("tuluan-dapan-badge-link");
    const badgeFilename = document.getElementById("tuluan-dapan-badge-filename");
    const badgeMoiMini = document.getElementById("badge-moi-mini-text");
    const delMiniBtn = document.getElementById("btn-del-dapan-mini");

    const fullStrip = document.getElementById("tuluan-dapan-full-strip");
    const stripFilename = document.getElementById("strip-dapan-filename");
    const stripLink = document.getElementById("strip-dapan-link");
    const stripTime = document.getElementById("strip-dapan-time");
    const stripOpenBtn = document.getElementById("strip-dapan-open-btn");
    const stripDelBtn = document.getElementById("strip-dapan-del-btn");
    const stripBadgeTag = document.getElementById("strip-dapan-badge-tag");

    if (schedBtn) {
        if (dapan && dapan.scheduleTime) {
            schedBtn.classList.add("has-schedule");
            schedBtn.title = `Đang hẹn giờ mở lúc: ${new Date(dapan.scheduleTime).toLocaleString("vi-VN")}`;
            schedBtn.innerHTML = `⏰ Đã hẹn`;
        } else {
            schedBtn.classList.remove("has-schedule");
            schedBtn.title = "Hẹn giờ tự động mở đáp án cho học sinh";
            schedBtn.innerHTML = `⏰ Hẹn giờ`;
        }
    }

    if (dapan && dapan.fileUrl) {
        const directUrl = dapan.fileUrl;
        const name = dapan.fileName || "Đáp án chấm";
        const uploadTime = dapan.uploadedAt || "";
        const isUnlocked = isDapAnUnlocked(dapan);

        // 1. Badge mini cạnh nút Upload & Hẹn giờ
        if (badgeWrap) badgeWrap.style.display = "inline-flex";
        if (badgeFilename) badgeFilename.innerText = name;

        if (badgeLink) {
            if (isUnlocked) {
                badgeLink.href = directUrl;
                badgeLink.classList.remove("is-locked");
                badgeLink.title = `Mở Đáp án: ${name} (${uploadTime})`;
                if (badgeMoiMini) {
                    badgeMoiMini.innerText = "MỚI";
                    badgeMoiMini.style.backgroundColor = "#0284c7";
                }
            } else {
                badgeLink.href = "javascript:void(0)";
                badgeLink.classList.add("is-locked");
                const remain = formatRemainingLockTime(new Date(dapan.scheduleTime).getTime());
                badgeLink.title = `🔒 Đáp án đang khóa! Sẽ tự động mở sau: ${remain}`;
                if (badgeMoiMini) {
                    badgeMoiMini.innerText = "KHÓA";
                    badgeMoiMini.style.backgroundColor = "#ea580c";
                }
            }
        }
        if (delMiniBtn) delMiniBtn.style.display = isAdmin ? "inline-flex" : "none";

        // 2. Dòng thông báo nổi bật phong cách Dân trí như ảnh chụp của Thầy
        if (fullStrip) {
            fullStrip.style.display = "flex";
            if (!isUnlocked) {
                fullStrip.classList.add("strip-locked");
            } else {
                fullStrip.classList.remove("strip-locked");
            }
        }

        if (isUnlocked) {
            if (stripBadgeTag) {
                stripBadgeTag.className = "dapan-badge-new";
                stripBadgeTag.innerText = "MỚI";
            }
            if (stripFilename) stripFilename.innerText = name;
            if (stripLink) {
                stripLink.href = directUrl;
                stripLink.style.pointerEvents = "auto";
            }
            if (stripTime) stripTime.innerText = `📅 ${uploadTime}`;
            if (stripOpenBtn) {
                stripOpenBtn.href = directUrl;
                stripOpenBtn.className = "btn-open-dapan-strip";
                stripOpenBtn.innerText = isAdmin ? "🔗 Mở xem (Admin)" : "🔗 Mở xem";
            }
        } else {
            // Trường hợp đang khóa đối với học sinh
            const schedStr = new Date(dapan.scheduleTime).toLocaleString("vi-VN");
            const remain = formatRemainingLockTime(new Date(dapan.scheduleTime).getTime());

            if (stripBadgeTag) {
                stripBadgeTag.className = "dapan-badge-new badge-lock";
                stripBadgeTag.innerText = "HẸN GIỜ";
            }
            if (stripFilename) {
                stripFilename.innerText = `${name} [Tự động mở lúc: ${schedStr} - Còn ${remain}]`;
            }
            if (stripTime) stripTime.innerText = `⏳ Đang khóa với học sinh`;

            if (isAdmin) {
                // Giáo viên vẫn có quyền bấm vào xem trước
                if (stripLink) {
                    stripLink.href = directUrl;
                    stripLink.style.pointerEvents = "auto";
                }
                if (stripOpenBtn) {
                    stripOpenBtn.href = directUrl;
                    stripOpenBtn.className = "btn-open-dapan-strip";
                    stripOpenBtn.innerText = "🔗 Mở xem (Admin)";
                }
            } else {
                // Học sinh bị vô hiệu hóa liên kết
                if (stripLink) {
                    stripLink.href = "javascript:void(0)";
                    stripLink.style.pointerEvents = "none";
                }
                if (stripOpenBtn) {
                    stripOpenBtn.href = "javascript:void(0)";
                    stripOpenBtn.className = "btn-open-dapan-strip disabled-strip";
                    stripOpenBtn.innerText = "🔒 Đang khóa";
                }
            }
        }

        if (stripDelBtn) stripDelBtn.style.display = isAdmin ? "inline-flex" : "none";
    } else {
        if (badgeWrap) badgeWrap.style.display = "none";
        if (fullStrip) fullStrip.style.display = "none";
    }

    updateTuLuanAdminUI();
}

// Render bảng học sinh (Bao gồm Cột Chấm chéo nhau và Cột Nhận xét)
function renderTuLuanStudentsTable() {
    const tbody = document.getElementById("tuluan-students-tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    const students = getAccountsForCategory(currentTuLuanModalData.classId);
    const searchVal = (document.getElementById("tuluan-search-student")?.value || "").trim().toLowerCase();
    const subMap = currentTuLuanModalData.submissionsMap || {};
    const isAdmin = checkCurrentIsAdmin();

    const loggedStudentSbd = (safeLocal.getItem("saved_student_sbd") || "").trim().toLowerCase();

    let totalSt = students.length;
    let submittedCount = 0;

    students.forEach(st => {
        const cleanSbd = String(st.sbd || "").trim().replace(/[^a-zA-Z0-9]/g, '_');
        if (subMap[cleanSbd] && subMap[cleanSbd].images && subMap[cleanSbd].images.length > 0) {
            submittedCount++;
        }
    });

    const elTotal = document.getElementById("count-all-st");
    const elSub = document.getElementById("count-sub-st");
    const elPen = document.getElementById("count-pen-st");
    if (elTotal) elTotal.innerText = totalSt;
    if (elSub) elSub.innerText = submittedCount;
    if (elPen) elPen.innerText = (totalSt - submittedCount);

    students.forEach(st => {
        const cleanSbd = String(st.sbd || "").trim().replace(/[^a-zA-Z0-9]/g, '_');
        const record = subMap[cleanSbd];
        const hasSubmitted = Boolean(record && record.images && record.images.length > 0);
        const isApproved = Boolean(record && record.isApproved === true);

        if (currentTuLuanModalData.statusFilter === "submitted" && !hasSubmitted) return;
        if (currentTuLuanModalData.statusFilter === "pending" && hasSubmitted) return;

        if (searchVal) {
            const nameNorm = (typeof normalizeName === 'function') ? normalizeName(st.name) : st.name.toLowerCase();
            const sbdNorm = String(st.sbd || "").toLowerCase();
            if (!nameNorm.includes(searchVal) && !sbdNorm.includes(searchVal)) return;
        }

        const tr = document.createElement("tr");

        let statusHtml = `<span class="tuluan-status-badge pending">⏳ Chưa nộp</span>`;
        let thumbnailsHtml = `<span style="font-size:11.5px; color:#94a3b8; font-style:italic;">Chưa có ảnh</span>`;

        let approveHtml = "";
        if (!hasSubmitted) {
            approveHtml = `<span style="color:#cbd5e1; font-weight:700;">---</span>`;
        } else if (isAdmin) {
            approveHtml = `
                <label class="approve-switch-wrapper" title="Bật/Tắt duyệt bài cho học sinh này" onclick="event.stopPropagation()">
                    <span class="mini-switch">
                        <input type="checkbox" ${isApproved ? "checked" : ""} onchange="handleToggleApproveStudent('${cleanSbd}', this.checked)">
                        <span class="slider-toggle" style="${isApproved ? 'background-color:#10b981;' : ''}"></span>
                    </span>
                    <b class="approve-text ${isApproved ? 'approved' : 'pending'}">${isApproved ? 'Đã duyệt' : 'Chưa duyệt'}</b>
                </label>
            `;
        } else {
            approveHtml = isApproved 
                ? `<span class="tuluan-approved-badge yes">✅ Đã duyệt</span>`
                : `<span class="tuluan-approved-badge no">⏳ Chưa duyệt</span>`;
        }

        const sessionAuthKey = `tuluan_authed_${currentTuLuanModalData.quizId}_${cleanSbd}`;
        const isSessionAuthed = (safeSession.getItem(sessionAuthKey) === "true");
        const isOwner = Boolean(
            (loggedStudentSbd && loggedStudentSbd === String(st.sbd).trim().toLowerCase()) ||
            isSessionAuthed
        );

        if (hasSubmitted) {
            const imgCount = record.images.length;
            const lastTime = record.lastSubmit || "Vừa xong";
            statusHtml = `
                <div class="tuluan-status-badge done">✅ Đã nộp ${imgCount} ảnh</div>
                <div style="font-size: 11px; color: #64748b; font-weight: 700; margin-top: 2px;">🕒 ${lastTime}</div>
            `;

            const canViewDetailed = (isAdmin || isApproved || isOwner);
            const canDeleteThisStudentImage = (isAdmin || isOwner);

            thumbnailsHtml = `
                <div class="tuluan-thumb-row">
                    ${record.images.map((im, idx) => `
                        <div class="tuluan-img-thumbnail-item ${!canViewDetailed ? 'locked-anti-cheat' : ''}" 
                             onclick="onThumbnailClicked('${im.directUrl || im.fileUrl}', '${im.fileUrl}', '${st.name} - Trang ${idx + 1}', ${canViewDetailed}, event)" 
                             title="${canViewDetailed ? 'Bấm để xem ảnh phóng to' : '🔒 Bài làm đang chờ Thầy phê duyệt, em chưa thể xem chi tiết!'}">
                            <img src="${im.directUrl || im.fileUrl}" alt="Trang ${idx + 1}">
                            <span class="tuluan-thumb-page">Trang ${idx + 1}</span>
                            ${!canViewDetailed ? `<div class="lock-overlay-icon">🔒</div>` : ''}
                            
                            <!-- NÚT XÓA ẢNH (✕): CHỈ HIỂN THỊ KHI LÀ ADMIN HOẶC CHÍNH HỌC SINH ĐÓ -->
                            ${canDeleteThisStudentImage ? `
                                <button type="button" class="btn-del-single-thumb" 
                                    onclick="deleteSingleStudentImage('${cleanSbd}', ${idx}, '${st.name}', '${st.pass}', event)" 
                                    title="Xóa bức ảnh này">✕</button>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            `;
        }

        // CỘT CHẤM CHÉO NHAU (GHI NHẬN DANH TÍNH & HIỆN TOOLTIP KHI HOVER)
        const currentCrossScore = (record && record.crossScore !== undefined && record.crossScore !== null) ? record.crossScore : '';
        const crossScoreBy = (record && record.crossScoreBy) ? record.crossScoreBy : '';
        const crossScoreTime = (record && record.crossScoreTime) ? record.crossScoreTime : '';

        let scoreTooltip = "Nhập điểm chấm chéo (nhập xong tự động lưu người chấm)";
        if (currentCrossScore !== "") {
            scoreTooltip = `🎯 Điểm: ${currentCrossScore}đ\n👤 Người chấm: ${crossScoreBy || "Chưa rõ"}${crossScoreTime ? `\n🕒 Lúc: ${crossScoreTime}` : ""}`;
        }

        const crossScoreHtml = `
            <input type="text" class="tuluan-score-input" id="cross-score-${cleanSbd}"
                   value="${currentCrossScore}" placeholder="VD: 8.7"
                   onchange="saveStudentCrossScore('${cleanSbd}', '${st.stt}', '${st.sbd}', '${st.name}', this.value)"
                   title="${scoreTooltip}">
        `;

        // CỘT NHẬN XÉT (XÒE BẢNG NHẬP LIỆU RA PHÍA TRÊN)
        const currentFeedback = (record && record.feedback) ? record.feedback : '';
        const hasFeedback = Boolean(currentFeedback && currentFeedback.trim() !== "");
        const feedbackHtml = `
            <div style="position: relative; display: inline-block;">
                <button type="button" class="btn-tuluan-comment ${hasFeedback ? 'active' : ''}" 
                        onclick="toggleStudentFeedbackPopover('${cleanSbd}', event)" 
                        title="${hasFeedback ? ('Nhận xét: ' + currentFeedback) : 'Bấm để viết nhận xét bài làm'}">
                    ${hasFeedback ? '💬 Đã có NX' : '💬 Nhận xét'}
                </button>

                <!-- KHUNG XÒE NHẬN XÉT NỔI LÊN TRÊN -->
                <div class="student-feedback-popover" id="feedback-popover-${cleanSbd}" onclick="event.stopPropagation()">
                    <div class="pass-popover-header">
                        <span>💬 Nhận Xét: <b>${st.name}</b></span>
                        <button type="button" class="btn-close-pass-pop" onclick="closeStudentFeedbackPopover('${cleanSbd}', event)">✕</button>
                    </div>
                    <div style="font-size: 11px; color: #64748b; margin-bottom: 6px; line-height: 1.35;">
                        Nhận xét bài làm, góp ý chi tiết hoặc lời khen cho học sinh:
                    </div>
                    <textarea id="feedback-textarea-${cleanSbd}" rows="3" class="feedback-textarea" placeholder="Nhập nhận xét chi tiết...">${currentFeedback}</textarea>
                    <div class="pass-popover-actions">
                        <button type="button" class="btn-pass-cancel" onclick="closeStudentFeedbackPopover('${cleanSbd}', event)">Hủy</button>
                        <button type="button" class="btn-pass-save" style="background: linear-gradient(135deg, #d97706, #b45309);" onclick="saveStudentFeedback('${cleanSbd}', '${st.stt}', '${st.sbd}', '${st.name}', event)">💾 Lưu NX</button>
                    </div>
                </div>
            </div>
        `;

        tr.innerHTML = `
            <td style="text-align: center; font-weight: 800; color: #475569;">${st.stt}</td>
            <td style="font-weight: 800; color: #0f172a;">${st.name}</td>
            <td style="text-align: center; font-weight: 800; color: #0284c7; font-family: monospace;">${st.sbd}</td>
            <td>${statusHtml}</td>
            <td style="text-align: center;">${approveHtml}</td>
            <td>${thumbnailsHtml}</td>
            <td style="text-align: center;">${crossScoreHtml}</td>
            <td style="text-align: center;">${feedbackHtml}</td>
            <td style="text-align: center; position: relative;">
                <div class="tuluan-action-btn-group">
                    <input type="file" id="tuluan-input-${cleanSbd}" accept="image/*" multiple style="display:none;" onchange="handleStudentEssayUploadPC('${st.stt}', '${st.sbd}', '${st.name}', this)">
                    <button type="button" class="btn-tuluan-upload-row" onclick="triggerStudentUpload('${st.stt}', '${st.sbd}', '${st.name}', '${st.pass}')" id="btn-up-${cleanSbd}" title="Tải ảnh bài làm">
                        📷 Tải ảnh
                    </button>
                    <!-- NÚT ĐỔI MẬT KHẨU CÙNG HÀNG BÊN PHẢI -->
                    <button type="button" class="btn-tuluan-change-pass" onclick="toggleStudentPassPopover('${cleanSbd}', event)" title="Đổi mật khẩu nộp bài (4 số)">
                        🔑 Đổi MK
                    </button>
                    <!-- NÚT RESET DÀNH CHO ADMIN KHI HỌC SINH QUÊN -->
                    ${isAdmin ? `
                        <button type="button" class="btn-tuluan-reset-pass" onclick="resetStudentPasswordToDefault('${cleanSbd}', '${st.sbd}', '${st.name}', event)" title="[Admin] Reset mật khẩu về mặc định (${st.sbd})">
                            ↺ Reset
                        </button>
                    ` : ''}
                </div>

                <!-- KHUNG XÒE 2 DÒNG ĐỔI MẬT KHẨU: XÒE LÊN TRÊN & ĐẨY Z-INDEX CAO NHẤT -->
                <div class="student-pass-popover" id="pass-popover-${cleanSbd}" onclick="event.stopPropagation()">
                    <div class="pass-popover-header">
                        <span>🔑 Đổi Mật Khẩu: <b>${st.name}</b></span>
                        <button type="button" class="btn-close-pass-pop" onclick="closeStudentPassPopover('${cleanSbd}', event)">✕</button>
                    </div>
                    <div class="pass-popover-hint">
                        💡 Mật khẩu gồm đúng <b>4 chữ số</b>.<br>
                        Mặc định ban đầu là Số báo danh (<b>${st.sbd}</b>).
                    </div>
                    <div class="pass-input-row">
                        <label>Dòng 1: Mật khẩu cũ (hoặc SBD):</label>
                        <input type="password" id="old-pass-${cleanSbd}" placeholder="Nhập mật khẩu cũ..." autocomplete="off">
                    </div>
                    <div class="pass-input-row">
                        <label>Dòng 2: Mật khẩu mới (4 số):</label>
                        <input type="password" id="new-pass-${cleanSbd}" placeholder="4 số, VD: 1234..." maxlength="4" pattern="[0-9]{4}" inputmode="numeric" autocomplete="new-password">
                    </div>
                    <div class="pass-popover-actions">
                        <button type="button" class="btn-pass-cancel" onclick="closeStudentPassPopover('${cleanSbd}', event)">Hủy</button>
                        <button type="button" class="btn-pass-save" onclick="saveStudentPasswordChange('${cleanSbd}', '${st.sbd}', '${st.name}', '${st.pass}', event)">💾 Lưu MK</button>
                    </div>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    updateTuLuanAdminUI();
}

// LƯU ĐIỂM CHẤM CHÉO NHAU VÀO SUPABASE (tu_luan_submissions)
async function saveStudentCrossScore(cleanSbd, stt, sbd, studentName, scoreVal) {
    const qId = currentTuLuanModalData.quizId;
    if (!qId) return;

    const trimmedScore = String(scoreVal || "").trim();
    const driveClassName = getCleanDriveClassName(currentTuLuanModalData.classId);

    let graderDisplay = "";
    let scoreTimeStr = "";
    if (trimmedScore !== "") {
        const graderInfo = getCurrentGraderInfo();
        graderDisplay = graderInfo.sbd && graderInfo.sbd !== "ADMIN" 
            ? `${graderInfo.name} (${graderInfo.sbd})` 
            : graderInfo.name;
        const now = new Date();
        const pad = n => String(n).padStart(2, '0');
        scoreTimeStr = `${pad(now.getHours())}:${pad(now.getMinutes())} ${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;
    }

    if (!currentTuLuanModalData.submissionsMap[cleanSbd]) {
        currentTuLuanModalData.submissionsMap[cleanSbd] = {
            stt: stt,
            sbd: sbd,
            studentName: studentName,
            className: driveClassName,
            count: 0,
            images: [],
            crossScore: trimmedScore,
            crossScoreBy: graderDisplay,
            crossScoreTime: scoreTimeStr
        };
    } else {
        currentTuLuanModalData.submissionsMap[cleanSbd].crossScore = trimmedScore;
        currentTuLuanModalData.submissionsMap[cleanSbd].crossScoreBy = graderDisplay;
        currentTuLuanModalData.submissionsMap[cleanSbd].crossScoreTime = scoreTimeStr;
    }

    try {
        const client = getDbClient();
        if (client) {
            await client.from('tu_luan_submissions').upsert({
                quiz_id: qId,
                sbd: cleanSbd,
                stt: String(stt || "00"),
                student_name: studentName,
                class_name: driveClassName,
                exam_title: currentTuLuanModalData.examTitle || "Tự luận",
                cross_score: trimmedScore,
                cross_score_by: graderDisplay,
                cross_score_time: scoreTimeStr
            }, { onConflict: 'quiz_id,sbd' });
        }

        const scoreInput = document.getElementById(`cross-score-${cleanSbd}`);
        if (scoreInput) {
            scoreInput.style.borderColor = "#10b981";
            if (trimmedScore !== "") {
                scoreInput.title = `🎯 Điểm: ${trimmedScore}đ\n👤 Người chấm: ${graderDisplay}\n🕒 Lúc: ${scoreTimeStr}`;
            } else {
                scoreInput.title = "Nhập điểm chấm chéo (nhập xong tự động lưu người chấm)";
            }
            setTimeout(() => { scoreInput.style.borderColor = "#cbd5e1"; }, 1500);
        }
    } catch(err) {
        console.error("Lỗi lưu điểm chấm chéo Supabase:", err);
    }
}

// BẬT / TẮT KHUNG NHẬN XÉT CỦA HỌC SINH
function toggleStudentFeedbackPopover(cleanSbd, event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    const pop = document.getElementById(`feedback-popover-${cleanSbd}`);
    if (!pop) return;
    const isShown = pop.classList.contains("show");

    document.querySelectorAll(".student-pass-popover.show").forEach(p => p.classList.remove("show"));
    document.querySelectorAll(".student-feedback-popover.show").forEach(p => p.classList.remove("show"));
    document.querySelectorAll(".dapan-schedule-popover.show").forEach(p => p.classList.remove("show"));
    document.querySelectorAll(".tuluan-td-active-popover").forEach(td => td.classList.remove("tuluan-td-active-popover"));

    if (!isShown) {
        pop.classList.add("show");
        const parentTd = pop.closest("td");
        if (parentTd) parentTd.classList.add("tuluan-td-active-popover");

        const tableWrap = document.querySelector(".tuluan-table-wrap");
        if (tableWrap && parentTd) {
            const tdRect = parentTd.getBoundingClientRect();
            const wrapRect = tableWrap.getBoundingClientRect();
            if (tdRect.top - wrapRect.top < 220) {
                pop.style.setProperty("bottom", "auto", "important");
                pop.style.setProperty("top", "calc(100% + 6px)", "important");
            } else {
                pop.style.setProperty("bottom", "calc(100% + 6px)", "important");
                pop.style.setProperty("top", "auto", "important");
            }
        }
        const textarea = document.getElementById(`feedback-textarea-${cleanSbd}`);
        if (textarea) textarea.focus();
    }
}

function closeStudentFeedbackPopover(cleanSbd, event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    const pop = document.getElementById(`feedback-popover-${cleanSbd}`);
    if (pop) {
        pop.classList.remove("show");
        const parentTd = pop.closest("td");
        if (parentTd) parentTd.classList.remove("tuluan-td-active-popover");
    }
}

// LƯU NHẬN XÉT VÀO SUPABASE (tu_luan_submissions)
async function saveStudentFeedback(cleanSbd, stt, sbd, studentName, event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    const textarea = document.getElementById(`feedback-textarea-${cleanSbd}`);
    if (!textarea) return;

    const feedbackVal = textarea.value.trim();
    const qId = currentTuLuanModalData.quizId;
    if (!qId) return;

    const driveClassName = getCleanDriveClassName(currentTuLuanModalData.classId);

    if (!currentTuLuanModalData.submissionsMap[cleanSbd]) {
        currentTuLuanModalData.submissionsMap[cleanSbd] = {
            stt: stt,
            sbd: sbd,
            studentName: studentName,
            className: driveClassName,
            count: 0,
            images: [],
            feedback: feedbackVal,
            feedbackTime: new Date().toLocaleString("vi-VN")
        };
    } else {
        currentTuLuanModalData.submissionsMap[cleanSbd].feedback = feedbackVal;
        currentTuLuanModalData.submissionsMap[cleanSbd].feedbackTime = new Date().toLocaleString("vi-VN");
    }

    try {
        const client = getDbClient();
        if (client) {
            await client.from('tu_luan_submissions').upsert({
                quiz_id: qId,
                sbd: cleanSbd,
                stt: String(stt || "00"),
                student_name: studentName,
                class_name: driveClassName,
                exam_title: currentTuLuanModalData.examTitle || "Tự luận",
                feedback: feedbackVal,
                feedback_time: new Date().toLocaleString("vi-VN")
            }, { onConflict: 'quiz_id,sbd' });
        }

        closeStudentFeedbackPopover(cleanSbd);
        renderTuLuanStudentsTable();
    } catch(err) {
        alert("❌ Lỗi khi lưu nhận xét: " + err.message);
    }
}

// XUẤT EXCEL ĐIỂM TỰ LUẬN KÈM ẢNH BÀI LÀM VÀ DANH TÍNH NGƯỜI CHẤM
function exportTuLuanToExcel(event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }

    const students = getAccountsForCategory(currentTuLuanModalData.classId);
    if (!students || students.length === 0) {
        alert("⚠️ Không có dữ liệu học sinh để xuất Excel!");
        return;
    }

    const examTitle = currentTuLuanModalData.examTitle || "BAI_TAP_TU_LUAN";
    const driveClassName = getCleanDriveClassName(currentTuLuanModalData.classId);
    const subMap = currentTuLuanModalData.submissionsMap || {};

    let rowsHtml = "";
    students.forEach((st) => {
        const cleanSbd = String(st.sbd || "").trim().replace(/[^a-zA-Z0-9]/g, '_');
        const record = subMap[cleanSbd];

        const hasSub = Boolean(record && record.images && record.images.length > 0);
        const statusText = hasSub ? `Đã nộp (${record.images.length} ảnh) lúc ${record.lastSubmit || ''}` : "Chưa nộp";
        const isApprovedText = (record && record.isApproved === true) ? "Đã duyệt" : "Chưa duyệt";
        const scoreVal = (record && record.crossScore !== undefined) ? record.crossScore : "";
        const scoreBy = (record && record.crossScoreBy) ? record.crossScoreBy : "";
        const scoreTime = (record && record.crossScoreTime) ? record.crossScoreTime : "";
        const feedbackVal = (record && record.feedback) ? record.feedback : "";

        let imagesHtml = "Chưa có ảnh";
        if (hasSub && Array.isArray(record.images)) {
            imagesHtml = record.images.map((im, idx) => {
                const imgUrl = im.directUrl || im.fileUrl || "";
                const driveUrl = im.fileUrl || imgUrl;
                return `
                    <div style="display: inline-block; margin: 4px 6px; text-align: center; vertical-align: top;">
                        <img src="${imgUrl}" width="95" height="95" style="border: 1px solid #94a3b8; border-radius: 4px; object-fit: cover; display: block; margin-bottom: 3px;" alt="Trang ${idx + 1}"><br>
                        <a href="${driveUrl}" target="_blank" style="font-size: 10px; color: #0284c7; text-decoration: underline; font-weight: bold;">Trang ${idx + 1} [Drive]</a>
                    </div>
                `;
            }).join('');
        }

        rowsHtml += `
            <tr>
                <td style="text-align: center; font-weight: bold;">${st.stt}</td>
                <td style="font-weight: bold;">${st.name}</td>
                <td style="text-align: center; font-family: monospace; font-weight: bold;">${st.sbd}</td>
                <td>${statusText}</td>
                <td style="text-align: center;">${isApprovedText}</td>
                <td style="text-align: center; font-weight: bold; color: #0284c7; font-size: 13pt;">
                    ${scoreVal}
                    ${scoreBy ? `<br><span style="font-size:9pt; font-weight:normal; color:#64748b;">(Chấm bởi: ${scoreBy}${scoreTime ? ` - ${scoreTime}` : ''})</span>` : ''}
                </td>
                <td style="white-space: pre-wrap; word-break: break-word;">${feedbackVal}</td>
                <td style="min-width: 250px;">${imagesHtml}</td>
            </tr>
        `;
    });

    const excelCompleteHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
        <meta charset="utf-8">
        <title>Diem_Tu_Luan_${driveClassName}</title>
        <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Diem_Tu_Luan</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
        <style>
            body { font-family: 'Times New Roman', Arial, sans-serif; font-size: 11pt; color: #0f172a; }
            h2, h3 { margin: 4px 0; }
            table { border-collapse: collapse; width: 100%; margin-top: 10px; }
            th { background-color: #0284c7; color: #ffffff; font-weight: bold; padding: 8px 10px; border: 1px solid #94a3b8; text-align: center; font-size: 11pt; }
            td { border: 1px solid #cbd5e1; padding: 8px 10px; vertical-align: middle; }
            tr:nth-child(even) td { background-color: #f8fafc; }
        </style>
    </head>
    <body>
        <h2>BẢNG ĐIỂM & NHẬN XÉT BÀI TẬP TỰ LUẬN</h2>
        <h3>Đề thi: ${examTitle}</h3>
        <p><b>Lớp:</b> ${driveClassName} &nbsp;|&nbsp; <b>Thời gian xuất file:</b> ${new Date().toLocaleTimeString('vi-VN')} ${new Date().toLocaleDateString('vi-VN')}</p>
        <table>
            <thead>
                <tr>
                    <th style="width: 45px;">STT</th>
                    <th style="width: 170px;">Họ và tên</th>
                    <th style="width: 80px;">SBD</th>
                    <th style="width: 160px;">Trạng thái / Ngày nộp</th>
                    <th style="width: 100px;">Phê duyệt</th>
                    <th style="width: 140px;">Điểm chấm chéo (Người chấm)</th>
                    <th style="width: 220px;">Nhận xét bài làm</th>
                    <th style="width: 380px;">Ảnh bài làm đã nộp (Hiển thị trực tiếp)</th>
                </tr>
            </thead>
            <tbody>
                ${rowsHtml}
            </tbody>
        </table>
    </body>
    </html>
    `;

    const blob = new Blob(['\ufeff', excelCompleteHtml], {
        type: 'application/vnd.ms-excel;charset=utf-8'
    });

    const safeExam = examTitle.replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]/g, '_');
    const fileName = `Diem_Tu_Luan_${driveClassName}_${safeExam}_${Date.now()}.xls`;

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(link.href), 1500);
}

// BẬT / TẮT KHUNG ĐỔI MẬT KHẨU CỦA MỖI HỌC SINH
function toggleStudentPassPopover(cleanSbd, event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    const pop = document.getElementById(`pass-popover-${cleanSbd}`);
    if (!pop) return;
    const isShown = pop.classList.contains("show");

    document.querySelectorAll(".student-pass-popover.show").forEach(p => p.classList.remove("show"));
    document.querySelectorAll(".student-feedback-popover.show").forEach(p => p.classList.remove("show"));
    document.querySelectorAll(".dapan-schedule-popover.show").forEach(p => p.classList.remove("show"));
    document.querySelectorAll(".tuluan-td-active-popover").forEach(td => td.classList.remove("tuluan-td-active-popover"));

    if (!isShown) {
        pop.classList.add("show");
        const parentTd = pop.closest("td");
        if (parentTd) {
            parentTd.classList.add("tuluan-td-active-popover");
        }

        const tableWrap = document.querySelector(".tuluan-table-wrap");
        if (tableWrap && parentTd) {
            const tdRect = parentTd.getBoundingClientRect();
            const wrapRect = tableWrap.getBoundingClientRect();
            if (tdRect.top - wrapRect.top < 220) {
                pop.style.setProperty("bottom", "auto", "important");
                pop.style.setProperty("top", "calc(100% + 6px)", "important");
            } else {
                pop.style.setProperty("bottom", "calc(100% + 6px)", "important");
                pop.style.setProperty("top", "auto", "important");
            }
        }

        const oldIn = document.getElementById(`old-pass-${cleanSbd}`);
        const newIn = document.getElementById(`new-pass-${cleanSbd}`);
        if (oldIn) { oldIn.value = ""; oldIn.focus(); }
        if (newIn) newIn.value = "";
    }
}

function closeStudentPassPopover(cleanSbd, event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    const pop = document.getElementById(`pass-popover-${cleanSbd}`);
    if (pop) {
        pop.classList.remove("show");
        const parentTd = pop.closest("td");
        if (parentTd) parentTd.classList.remove("tuluan-td-active-popover");
    }
}

// HỌC SINH TỰ LƯU ĐỔI MẬT KHẨU VÀO SUPABASE (app_key_values)
async function saveStudentPasswordChange(cleanSbd, defaultSbd, studentName, defaultPass, event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    const oldPassInput = document.getElementById(`old-pass-${cleanSbd}`);
    const newPassInput = document.getElementById(`new-pass-${cleanSbd}`);
    if (!oldPassInput || !newPassInput) return;

    const oldVal = oldPassInput.value.trim();
    const newVal = newPassInput.value.trim();
    const effectiveOldPass = getEffectiveStudentPassword(cleanSbd, defaultSbd, defaultPass);

    if (!oldVal) {
        alert("⚠️ Vui lòng nhập Mật khẩu cũ (hoặc SBD) của em!");
        oldPassInput.focus();
        return;
    }

    const isOldOk = (oldVal.toLowerCase() === effectiveOldPass.toLowerCase()) ||
                    (oldVal.toLowerCase() === String(defaultSbd).trim().toLowerCase()) ||
                    (defaultPass && oldVal.toLowerCase() === String(defaultPass).trim().toLowerCase());

    if (!isOldOk) {
        alert("❌ Mật khẩu cũ không chính xác! Nếu em quên mật khẩu, hãy nhờ Thầy giáo bấm Reset về mặc định nhé.");
        oldPassInput.focus();
        return;
    }

    if (!/^\d{4}$/.test(newVal)) {
        alert("⚠️ Mật khẩu mới phải gồm đúng 4 chữ số (Ví dụ: 1234, 6789, 0000)!");
        newPassInput.focus();
        return;
    }

    if (newVal === effectiveOldPass) {
        alert("⚠️ Mật khẩu mới không được trùng với mật khẩu hiện tại!");
        newPassInput.focus();
        return;
    }

    try {
        currentTuLuanModalData.customPasswords = currentTuLuanModalData.customPasswords || {};
        currentTuLuanModalData.customPasswords[cleanSbd] = newVal;

        const client = getDbClient();
        if (client) {
            await client.from('app_key_values').upsert({
                key: 'student_custom_passwords',
                value: currentTuLuanModalData.customPasswords
            });
        }

        const sessionAuthKey = `tuluan_authed_${currentTuLuanModalData.quizId}_${cleanSbd}`;
        safeSession.setItem(sessionAuthKey, "true");

        closeStudentPassPopover(cleanSbd);
        alert(`🎉 ĐỔI MẬT KHẨU THÀNH CÔNG!\n\nHọc sinh: ${studentName} (SBD: ${defaultSbd})\nMật khẩu mới của em là: ${newVal}\n\n👉 Em hãy ghi nhớ 4 số này để nộp bài nhé!`);
        renderTuLuanStudentsTable();
    } catch(err) {
        alert("❌ Lỗi khi lưu mật khẩu: " + err.message);
    }
}

// ADMIN RESET MẬT KHẨU CỦA HỌC SINH VỀ MẶC ĐỊNH
async function resetStudentPasswordToDefault(cleanSbd, defaultSbd, studentName, event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    const isAdmin = checkCurrentIsAdmin();
    if (!isAdmin) {
        alert("⛔ Chỉ Giáo viên quản trị mới có quyền Reset mật khẩu!");
        return;
    }

    if (!confirm(`⚠️ XÁC NHẬN RESET MẬT KHẨU (ADMIN):\n\nThầy có chắc chắn muốn đưa mật khẩu của học sinh:\n[${studentName}] (SBD: ${defaultSbd})\nvề mặc định ban đầu là Số báo danh (${defaultSbd}) không?`)) {
        return;
    }

    try {
        if (currentTuLuanModalData.customPasswords) {
            delete currentTuLuanModalData.customPasswords[cleanSbd];
        }

        const client = getDbClient();
        if (client) {
            await client.from('app_key_values').upsert({
                key: 'student_custom_passwords',
                value: currentTuLuanModalData.customPasswords || {}
            });
        }

        const sessionAuthKey = `tuluan_authed_${currentTuLuanModalData.quizId}_${cleanSbd}`;
        safeSession.removeItem(sessionAuthKey);

        alert(`✅ ĐÃ RESET MẬT KHẨU THÀNH CÔNG!\n\nMật khẩu của em [${studentName}] đã được khôi phục về mặc định ban đầu là Số báo danh: ${defaultSbd}.`);
        renderTuLuanStudentsTable();
    } catch(err) {
        alert("❌ Lỗi reset mật khẩu: " + err.message);
    }
}

function onThumbnailClicked(imgSrc, driveUrl, title, canView, event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    if (!canView) {
        alert("🔒 BÀI LÀM ĐANG CHỜ THẦY PHÊ DUYỆT!\n\nĐể đảm bảo tính công bằng và chống sao chép bài làm, Thầy chưa mở tính năng xem chi tiết bài của bạn này. Sau khi Thầy phê duyệt, em sẽ được xem để học hỏi nhé!");
        return;
    }
    openTuLuanLightbox(imgSrc, driveUrl, title, event);
}

// HÀM XÓA ẢNH BÀI LÀM (CHỈ CHÍNH CHỦ HOẶC ADMIN)
async function deleteSingleStudentImage(cleanSbd, imgIndex, studentName, defaultPass, event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }

    const isAdmin = checkCurrentIsAdmin();
    const loggedStudentSbd = (safeLocal.getItem("saved_student_sbd") || "").trim().toLowerCase();
    const sessionAuthKey = `tuluan_authed_${currentTuLuanModalData.quizId}_${cleanSbd}`;
    const isSessionAuthed = (safeSession.getItem(sessionAuthKey) === "true");
    const isOwner = Boolean(
        (loggedStudentSbd && loggedStudentSbd === cleanSbd.toLowerCase()) ||
        isSessionAuthed
    );

    if (!isAdmin && !isOwner) {
        const effectivePass = getEffectiveStudentPassword(cleanSbd, cleanSbd, defaultPass);
        const inputPass = prompt(`🔐 XÁC THỰC QUYỀN XÓA:\n\nBạn đang yêu cầu xóa ảnh bài làm của [${studentName}].\nVui lòng nhập đúng Mật khẩu hoặc SBD của bạn để xác nhận:`);
        if (!inputPass) return;
        const trimmed = inputPass.trim().toLowerCase();
        const isPassOk = (trimmed === effectivePass.toLowerCase()) || (trimmed === cleanSbd.toLowerCase());
        if (!isPassOk) {
            alert("⛔ BẠN KHÔNG CÓ QUYỀN XÓA!\nChỉ chính học sinh này hoặc Giáo viên quản trị mới có quyền xóa bài làm.");
            return;
        }
        safeSession.setItem(sessionAuthKey, "true");
    }

    const record = currentTuLuanModalData.submissionsMap[cleanSbd];
    if (!record || !Array.isArray(record.images) || !record.images[imgIndex]) {
        alert("⚠️ Không tìm thấy ảnh này để xóa!");
        return;
    }

    if (!confirm(`⚠️ XÁC NHẬN XÓA ẢNH:\n\nBạn có chắc chắn muốn xóa ảnh Trang ${imgIndex + 1} của học sinh [${studentName}] không?`)) {
        return;
    }

    const qId = currentTuLuanModalData.quizId;
    const removedImg = record.images[imgIndex];
    record.images.splice(imgIndex, 1);
    record.count = record.images.length;

    try {
        const client = getDbClient();
        if (client) {
            if (record.images.length === 0) {
                delete currentTuLuanModalData.submissionsMap[cleanSbd];
                await client.from('tu_luan_submissions').delete().eq('quiz_id', qId).eq('sbd', cleanSbd);
            } else {
                currentTuLuanModalData.submissionsMap[cleanSbd] = record;
                await client.from('tu_luan_submissions').update({
                    images: record.images,
                    count: record.images.length
                }).eq('quiz_id', qId).eq('sbd', cleanSbd);
            }
        }

        if (removedImg && removedImg.fileId) {
            const gasUrl = (typeof GOOGLE_DRIVE_TULUAN_GAS_URL !== "undefined" && GOOGLE_DRIVE_TULUAN_GAS_URL) 
                ? GOOGLE_DRIVE_TULUAN_GAS_URL 
                : GOOGLE_DRIVE_UPLOAD_GAS_URL;
            if (gasUrl && !gasUrl.includes("DÁN_URL")) {
                fetch(gasUrl, {
                    method: "POST",
                    headers: { "Content-Type": "text/plain;charset=utf-8" },
                    body: JSON.stringify({ action: "deleteFile", fileId: removedImg.fileId })
                }).catch(() => null);
            }
        }

        renderTuLuanStudentsTable();
        alert("🗑️ Đã xóa ảnh thành công!");
    } catch(err) {
        alert("❌ Lỗi khi xóa ảnh: " + err.message);
    }
}

// Bật/Tắt duyệt từng học sinh trong Supabase
async function handleToggleApproveStudent(cleanSbd, isChecked) {
    const qId = currentTuLuanModalData.quizId;
    if (!qId) return;

    try {
        const client = getDbClient();
        if (client) {
            await client.from('tu_luan_submissions').update({
                is_approved: isChecked
            }).eq('quiz_id', qId).eq('sbd', cleanSbd);
        }

        if (currentTuLuanModalData.submissionsMap[cleanSbd]) {
            currentTuLuanModalData.submissionsMap[cleanSbd].isApproved = isChecked;
        }
        renderTuLuanStudentsTable();
    } catch(err) {
        alert("❌ Lỗi cập nhật phê duyệt: " + err.message);
    }
}

// Duyệt toàn bộ đề trong Supabase
async function toggleApproveAllSubmissions(isApproved) {
    const qId = currentTuLuanModalData.quizId;
    const subMap = currentTuLuanModalData.submissionsMap || {};
    const keys = Object.keys(subMap);
    if (keys.length === 0) {
        alert("ℹ️ Chưa có bài nộp nào để phê duyệt!");
        return;
    }

    if (!confirm(`Bạn có chắc muốn ${isApproved ? 'PHÊ DUYỆT TẤT CẢ' : 'HỦY DUYỆT'} bài làm của đề này không?`)) return;

    try {
        const client = getDbClient();
        if (client) {
            await client.from('tu_luan_submissions').update({
                is_approved: isApproved
            }).eq('quiz_id', qId);
        }

        keys.forEach(k => { if (subMap[k]) subMap[k].isApproved = isApproved; });
        renderTuLuanStudentsTable();
        alert(`✅ Đã cập nhật trạng thái phê duyệt cho ${keys.length} học sinh!`);
    } catch(e) {
        alert("❌ Lỗi duyệt bài: " + e.message);
    }
}

function filterTuLuanStudentTable() { renderTuLuanStudentsTable(); }
function filterTuLuanStatus(filterType) {
    currentTuLuanModalData.statusFilter = filterType;
    document.querySelectorAll(".tuluan-tab-pill").forEach(p => p.classList.remove("active"));
    const activeBtn = document.getElementById(`tab-filter-${filterType}`);
    if (activeBtn) activeBtn.classList.add("active");
    renderTuLuanStudentsTable();
}

function triggerStudentUpload(stt, sbd, studentName, defaultPass) {
    const cleanSbd = String(sbd).replace(/[^a-zA-Z0-9]/g, '_');
    const sessionAuthKey = `tuluan_authed_${currentTuLuanModalData.quizId}_${cleanSbd}`;

    if (checkCurrentIsAdmin() || safeSession.getItem(sessionAuthKey) === "true") {
        document.getElementById(`tuluan-input-${cleanSbd}`).click();
        return;
    }

    const effectivePass = getEffectiveStudentPassword(cleanSbd, sbd, defaultPass);
    const inputPass = prompt(`🔐 XÁC NHẬN NỘP BÀI:\n\nEm đang nộp bài cho: [${stt}] ${studentName} (SBD: ${sbd}).\nVui lòng nhập Mật khẩu (mặc định: SBD) để xác nhận:`);
    if (inputPass === null) return;

    const trimmedInput = inputPass.trim().toLowerCase();
    const isPassOk = (trimmedInput === effectivePass.toLowerCase()) || 
                     (trimmedInput === String(sbd).trim().toLowerCase()) || 
                     (defaultPass && trimmedInput === String(defaultPass).trim().toLowerCase());

    if (isPassOk) {
        safeSession.setItem(sessionAuthKey, "true");
        document.getElementById(`tuluan-input-${cleanSbd}`).click();
    } else {
        alert("❌ Sai mật khẩu! Nếu em quên mật khẩu, hãy nhờ Thầy giáo bấm Reset mật khẩu cho em nhé.");
    }
}

// TỔ CHỨC CÂY THƯ MỤC DRIVE PHÂN CẤP 4 TẦNG & LƯU SUPABASE:
// BAI_TAP_TU_LUAN / LOP / DE / STT_SBD_HOTEN / ANH_CHUP
async function handleStudentEssayUploadPC(stt, sbd, studentName, fileInput) {
    if (!fileInput.files || fileInput.files.length === 0) return;

    const files = Array.from(fileInput.files);
    const cleanSbd = String(sbd).replace(/[^a-zA-Z0-9]/g, '_');
    const upBtn = document.getElementById(`btn-up-${cleanSbd}`);

    if (upBtn) {
        upBtn.disabled = true;
        upBtn.innerText = "⏳ Đang gửi...";
    }

    const classSelector = document.getElementById("tuluan-class-selector");
    const classId = (classSelector && classSelector.value) ? classSelector.value : (currentTuLuanModalData.classId || "lop-11a");
    currentTuLuanModalData.classId = classId;

    const driveClassName = getCleanDriveClassName(classId);
    const quizId = currentTuLuanModalData.quizId || "quiz";
    const examTitle = currentTuLuanModalData.examTitle || "BAI_TAP_TU_LUAN";
    const unifiedFolder = getUnifiedExamFolderKey(examTitle, "", quizId);
    const studentFolderName = getStudentFolderKey(stt, sbd, studentName, classId);

    const currentSub = currentTuLuanModalData.submissionsMap[cleanSbd] || {};
    const existingImages = Array.isArray(currentSub.images) ? [...currentSub.images] : [];

    let successCount = 0;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const pageIdx = existingImages.length + i + 1;
        try {
            if (upBtn) upBtn.innerText = `⏳ Nén ảnh ${i + 1}/${files.length}...`;
            const compressed = await compressImageForTuLuanAsync(file, 2048, 0.82);

            if (upBtn) upBtn.innerText = `🚀 Lưu trang ${pageIdx}...`;

            const payload = {
                rootFolder: "BAI_TAP_TU_LUAN",
                className: driveClassName,
                class: driveClassName,
                lop: driveClassName,
                examTitle: unifiedFolder,
                folderKey: unifiedFolder,
                studentFolder: studentFolderName,
                stt: stt,
                sbd: sbd,
                studentName: studentName,
                filename: `Trang_${pageIdx}_${Date.now()}.jpg`,
                mimeType: "image/jpeg",
                base64: compressed.base64
            };

            const gasUrl = (typeof GOOGLE_DRIVE_TULUAN_GAS_URL !== "undefined" && GOOGLE_DRIVE_TULUAN_GAS_URL)
                ? GOOGLE_DRIVE_TULUAN_GAS_URL
                : GOOGLE_DRIVE_UPLOAD_GAS_URL;

            const result = await sendToGoogleDriveWithRetry(gasUrl, payload, 2, 75000);
            if (result && result.status === "success" && result.fileId) {
                const directImgUrl = result.directUrl || (typeof toDirectGoogleDriveImageUrl === 'function' ? toDirectGoogleDriveImageUrl(result.fileUrl) : result.fileUrl);
                existingImages.push({
                    fileId: result.fileId,
                    fileUrl: result.fileUrl,
                    directUrl: directImgUrl,
                    fileName: payload.filename,
                    uploadedAt: new Date().toLocaleTimeString("vi-VN") + " " + new Date().toLocaleDateString("vi-VN")
                });
                successCount++;
            }
        } catch(err) {
            console.error(`Lỗi upload ảnh trang ${i + 1}:`, err);
            alert(`⚠️ Lỗi tải ảnh trang ${i + 1}: ${err.message}`);
        }
    }

    if (successCount > 0) {
        const now = new Date();
        const pad = n => String(n).padStart(2, '0');
        const submitDateStr = `${pad(now.getHours())}:${pad(now.getMinutes())} ${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;

        const subPayload = {
            quiz_id: quizId,
            sbd: cleanSbd,
            stt: String(stt || "00"),
            student_name: studentName,
            class_name: driveClassName,
            exam_title: examTitle,
            last_submit: submitDateStr,
            last_submit_time: Date.now(),
            count: existingImages.length,
            images: existingImages,
            cross_score: currentSub.crossScore || "",
            cross_score_by: currentSub.crossScoreBy || "",
            cross_score_time: currentSub.crossScoreTime || "",
            feedback: currentSub.feedback || "",
            feedback_time: currentSub.feedbackTime || "",
            is_approved: !!currentSub.isApproved
        };

        const client = getDbClient();
        if (client) {
            await client.from('tu_luan_submissions').upsert(subPayload, { onConflict: 'quiz_id,sbd' });
        }

        currentTuLuanModalData.submissionsMap[cleanSbd] = {
            stt: stt,
            sbd: sbd,
            studentName: studentName,
            className: driveClassName,
            examTitle: examTitle,
            lastSubmit: submitDateStr,
            lastSubmitTime: Date.now(),
            count: existingImages.length,
            images: existingImages,
            crossScore: currentSub.crossScore || "",
            crossScoreBy: currentSub.crossScoreBy || "",
            crossScoreTime: currentSub.crossScoreTime || "",
            feedback: currentSub.feedback || "",
            feedbackTime: currentSub.feedbackTime || "",
            isApproved: !!currentSub.isApproved
        };

        renderTuLuanStudentsTable();
        alert(`🎉 THÀNH CÔNG!\n\nĐã lưu ${successCount} ảnh bài làm vào Google Drive theo đường dẫn:\nBAI_TAP_TU_LUAN / ${driveClassName} / ${unifiedFolder} / ${studentFolderName}`);
    }

    if (upBtn) {
        upBtn.disabled = false;
        upBtn.innerText = "📷 Tải ảnh";
    }
    fileInput.value = "";
}

function openTuLuanLightbox(imgSrc, driveUrl, title, event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    const lb = document.getElementById("tuluan-lightbox");
    const fullImg = document.getElementById("lightbox-full-img");
    const titleEl = document.getElementById("lightbox-student-title");
    const driveLink = document.getElementById("lightbox-drive-link");

    if (fullImg) fullImg.src = imgSrc;
    if (titleEl) titleEl.innerText = title || "Ảnh bài làm tự luận";
    if (driveLink) driveLink.href = driveUrl || "#";
    if (lb) lb.style.display = "flex";
}

function closeTuLuanLightbox(event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    const lb = document.getElementById("tuluan-lightbox");
    if (lb) lb.style.display = "none";
}

// NỘP BÀI TỰ LUẬN TRONG BÀI THI (thi.html) QUA SUPABASE
async function triggerExamRoomDriveUpload(qId) {
    const sId = document.getElementById("student-id")?.value.trim() || safeLocal.getItem("saved_student_sbd") || "";
    const sName = document.getElementById("student-name")?.value.trim() || safeLocal.getItem("saved_student_name") || "";
    const sClass = document.getElementById("student-class")?.value.trim() || safeLocal.getItem("saved_student_class") || "";
    const currentCat = typeof getExamCategory === 'function' ? getExamCategory() : "";

    if (!sId || !sName) {
        alert("⚠️ Không xác định được thông tin học sinh đang làm bài!");
        return;
    }

    let input = document.getElementById(`drive-exam-input-${qId}`);
    if (!input) {
        input = document.createElement("input");
        input.type = "file";
        input.id = `drive-exam-input-${qId}`;
        input.accept = "image/*";
        input.multiple = true;
        input.style.display = "none";
        document.body.appendChild(input);

        input.onchange = async function() {
            if (!this.files || this.files.length === 0) return;
            const files = Array.from(this.files);

            const statusEl = document.getElementById(`drive-upload-status-${qId}`);
            if (statusEl) {
                statusEl.style.display = "inline-flex";
                statusEl.innerText = "⏳ Đang nén & lưu Drive...";
            }

            const urlParams = new URLSearchParams(window.location.search);
            const quizId = urlParams.get('id') || (typeof examData !== 'undefined' && examData && examData.id) || "quiz";
            const examTitle = (typeof examData !== 'undefined' && examData && examData.title) 
                ? examData.title 
                : (typeof EXAM_NAME !== 'undefined' && EXAM_NAME !== 'Bài thi' ? EXAM_NAME : "BAI_TAP_TU_LUAN");
            
            const driveClassName = getCleanDriveClassName(sClass || currentCat);
            const unifiedFolder = getUnifiedExamFolderKey(examTitle, (typeof getMaDe === 'function' ? getMaDe() : ""), quizId);
            
            const studentFolderName = getStudentFolderKey("00", sId, sName, currentCat || sClass);
            const cleanSbd = sId.replace(/[^a-zA-Z0-9]/g, '_');

            let existingImages = [];
            const client = getDbClient();
            if (client) {
                try {
                    const { data } = await client.from('tu_luan_submissions').select('images').eq('quiz_id', quizId).eq('sbd', cleanSbd).single();
                    if (data && Array.isArray(data.images)) existingImages = data.images;
                } catch(e) {}
            }

            let successCount = 0;
            for (let i = 0; i < files.length; i++) {
                const f = files[i];
                const pageIdx = existingImages.length + i + 1;
                try {
                    const comp = await compressImageForTuLuanAsync(f, 2048, 0.82);
                    const payload = {
                        rootFolder: "BAI_TAP_TU_LUAN",
                        className: driveClassName,
                        class: driveClassName,
                        lop: driveClassName,
                        examTitle: unifiedFolder,
                        folderKey: unifiedFolder,
                        studentFolder: studentFolderName,
                        stt: studentFolderName.split('_')[0] || "00",
                        sbd: sId,
                        studentName: sName,
                        filename: `Cau_${qId}_Trang_${pageIdx}_${Date.now()}.jpg`,
                        mimeType: "image/jpeg",
                        base64: comp.base64
                    };

                    const gasUrl = (typeof GOOGLE_DRIVE_TULUAN_GAS_URL !== "undefined" && GOOGLE_DRIVE_TULUAN_GAS_URL)
                        ? GOOGLE_DRIVE_TULUAN_GAS_URL
                        : GOOGLE_DRIVE_UPLOAD_GAS_URL;

                    const resJson = await sendToGoogleDriveWithRetry(gasUrl, payload, 2, 75000);
                    if (resJson && resJson.status === "success") {
                        existingImages.push({
                            fileId: resJson.fileId,
                            fileUrl: resJson.fileUrl,
                            directUrl: resJson.directUrl || resJson.fileUrl,
                            fileName: payload.filename,
                            uploadedAt: new Date().toLocaleTimeString("vi-VN")
                        });
                        successCount++;
                    }
                } catch(err) {
                    console.error("Lỗi upload ảnh tự luận trong phòng thi:", err);
                }
            }

            if (successCount > 0) {
                const submitRecord = {
                    quiz_id: quizId,
                    sbd: cleanSbd,
                    stt: studentFolderName.split('_')[0] || "00",
                    student_name: sName,
                    class_name: driveClassName,
                    exam_title: examTitle,
                    last_submit: new Date().toLocaleTimeString("vi-VN") + " " + new Date().toLocaleDateString("vi-VN"),
                    last_submit_time: Date.now(),
                    count: existingImages.length,
                    images: existingImages,
                    is_approved: false
                };

                if (client) {
                    await client.from('tu_luan_submissions').upsert(submitRecord, { onConflict: 'quiz_id,sbd' });
                }

                if (statusEl) {
                    statusEl.className = "drive-up-status success";
                    statusEl.innerText = `✅ Đã lưu ${existingImages.length} ảnh lên Drive!`;
                }
                alert(`✅ ĐÃ LƯU BÀI TỰ LUẬN THÀNH CÔNG!\n\nĐường dẫn Drive duy nhất:\nBAI_TAP_TU_LUAN / ${driveClassName} / ${unifiedFolder} / ${studentFolderName}`);
            } else {
                if (statusEl) {
                    statusEl.className = "drive-up-status error";
                    statusEl.innerText = `❌ Lỗi gửi ảnh!`;
                }
            }
            this.value = "";
        };
    }
    input.click();
}

// Đóng mọi popover khi bấm chuột ra ngoài và gỡ bỏ class active z-index
document.addEventListener("click", function(e) {
    if (!e.target.closest(".student-pass-popover") && 
        !e.target.closest(".student-feedback-popover") && 
        !e.target.closest(".dapan-schedule-popover") && 
        !e.target.closest(".btn-tuluan-change-pass") && 
        !e.target.closest(".btn-tuluan-comment") &&
        !e.target.closest("#btn-schedule-dapan")) {
        document.querySelectorAll(".student-pass-popover.show").forEach(p => p.classList.remove("show"));
        document.querySelectorAll(".student-feedback-popover.show").forEach(p => p.classList.remove("show"));
        document.querySelectorAll(".dapan-schedule-popover.show").forEach(p => p.classList.remove("show"));
        document.querySelectorAll(".tuluan-td-active-popover").forEach(td => td.classList.remove("tuluan-td-active-popover"));
    }
});

window.openTuLuanModal = openTuLuanModal;
window.closeTuLuanModal = closeTuLuanModal;
window.triggerStudentUpload = triggerStudentUpload;
window.handleStudentEssayUploadPC = handleStudentEssayUploadPC;
window.filterTuLuanStudentTable = filterTuLuanStudentTable;
window.filterTuLuanStatus = filterTuLuanStatus;
window.openTuLuanLightbox = openTuLuanLightbox;
window.closeTuLuanLightbox = closeTuLuanLightbox;
window.triggerExamRoomDriveUpload = triggerExamRoomDriveUpload;
window.onTuLuanClassChanged = onTuLuanClassChanged;
window.onTuLuanExamChanged = onTuLuanExamChanged;
window.promptAddNewTuLuanExam = promptAddNewTuLuanExam;
window.deleteCurrentTuLuanExam = deleteCurrentTuLuanExam;
window.handleToggleApproveStudent = handleToggleApproveStudent;
window.toggleApproveAllSubmissions = toggleApproveAllSubmissions;
window.onThumbnailClicked = onThumbnailClicked;
window.deleteSingleStudentImage = deleteSingleStudentImage;
window.getUnifiedExamFolderKey = getUnifiedExamFolderKey;
window.getCleanDriveClassName = getCleanDriveClassName;
window.getStudentFolderKey = getStudentFolderKey;
window.toggleStudentPassPopover = toggleStudentPassPopover;
window.closeStudentPassPopover = closeStudentPassPopover;
window.saveStudentPasswordChange = saveStudentPasswordChange;
window.resetStudentPasswordToDefault = resetStudentPasswordToDefault;
window.getEffectiveStudentPassword = getEffectiveStudentPassword;
window.getCurrentGraderInfo = getCurrentGraderInfo;
window.saveStudentCrossScore = saveStudentCrossScore;
window.toggleStudentFeedbackPopover = toggleStudentFeedbackPopover;
window.closeStudentFeedbackPopover = closeStudentFeedbackPopover;
window.saveStudentFeedback = saveStudentFeedback;
window.exportTuLuanToExcel = exportTuLuanToExcel;
window.triggerUploadDapAnCham = triggerUploadDapAnCham;
window.handleUploadDapAnCham = handleUploadDapAnCham;
window.deleteDapAnCham = deleteDapAnCham;
window.renderDapAnChamUI = renderDapAnChamUI;
window.toggleDapAnSchedulePopover = toggleDapAnSchedulePopover;
window.closeDapAnSchedulePopover = closeDapAnSchedulePopover;
window.onDapAnScheduleModeChanged = onDapAnScheduleModeChanged;
window.setScheduleToExamDeadline = setScheduleToExamDeadline;
window.saveDapAnSchedule = saveDapAnSchedule;
window.isDapAnUnlocked = isDapAnUnlocked;

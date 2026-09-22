/**
 * MODULE 8: XUẤT BẢNG KẾT QUẢ THI RA FILE EXCEL (.XLSX)
 */
window.EXPORT_EXCEL = {
    export() {
        if (!APP_STATE.currentExamResultData.rawRows || APP_STATE.currentExamResultData.rawRows.length === 0) {
            alert("⚠️ Chưa có dữ liệu để xuất file!");
            return;
        }

        const currentExamTitle = (APP_STATE.currentExamResultData.item && APP_STATE.currentExamResultData.item.title) ? APP_STATE.currentExamResultData.item.title : "Đề thi";

        const excelData = [
            [
                "STT", "Số đề thi", "Số lần thi", "Thời gian vào thi", "Thời gian thi", 
                "Họ và tên", "Lớp", "SBD", "Tình trạng", "Số câu đúng", 
                "Điểm thang 10", "Số lần chuyển tab", "Thời gian chuyển tab", "Chi tiết bài làm"
            ]
        ];

        APP_STATE.currentExamResultData.rawRows.forEach(r => {
            const attCount = r.allAttempts.length;
            const sub = attCount > 0 ? r.allAttempts[r.selectedAttemptIndex] : null;
            const acc = r.account;

            let stt = r.stt;
            let soLanThi = attCount > 0 ? `${attCount} lần (Đang xem lần ${r.selectedAttemptIndex + 1})` : "Chưa thi";
            let inTime = sub ? (sub.timestamp || "") : (r.isDoing ? "Đang thi" : "Chưa thi");
            let spent = sub ? (sub.completionTime || "") : "";
            let name = acc.name || "";
            let lop = acc.className || (sub ? (sub.studentClass || sub.className) : "") || "";
            let sbd = acc.sbd || "";
            let tinhTrang = sub ? "Đã nộp bài" : (r.isDoing ? "Đang làm bài" : "Chưa thi");
            let correct = sub ? (sub.calcMetrics ? sub.calcMetrics.correctCount : (sub.correctCount !== undefined ? sub.correctCount : 0)) : "";
            let score = sub ? (sub.score10 !== undefined ? sub.score10 : (sub.calcMetrics ? sub.calcMetrics.score10Scale : "")) : "";
            let tabs = sub ? (parseInt(sub.tabSwitchCount) || 0) : "";
            let cheatTimes = r.cheatTimeString || "";
            let details = sub ? (sub.dataString || "") : "";

            excelData.push([
                stt, currentExamTitle, soLanThi, inTime, spent, name, lop, sbd, 
                tinhTrang, correct, score, tabs, cheatTimes, details
            ]);
        });

        if (typeof XLSX !== "undefined") {
            const ws = XLSX.utils.aoa_to_sheet(excelData);
            ws['!cols'] = [
                { wch: 6 }, { wch: 28 }, { wch: 14 }, { wch: 22 }, { wch: 16 }, 
                { wch: 24 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 13 }, 
                { wch: 14 }, { wch: 18 }, { wch: 24 }, { wch: 55 }
            ];

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "KetQuaThi");

            let safeTitle = currentExamTitle.replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]/g, '_');
            XLSX.writeFile(wb, `${safeTitle}_${Date.now()}.xlsx`);
        } else {
            alert("❌ Không thể tải thư viện XLSX. Vui lòng kiểm tra kết nối mạng!");
        }
    }
};

function exportResultsToExcel() { EXPORT_EXCEL.export(); }
```
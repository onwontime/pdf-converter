const pdfInput = document.getElementById("pdfInput");
const convertBtn = document.getElementById("convertBtn");
const output = document.getElementById("output");
const status = document.getElementById("status");
const downloadAll = document.getElementById("downloadAll");

let selectedFile = null;
let zip = null;

pdfInput.addEventListener("change", (e) => {
  selectedFile = e.target.files[0];
  output.innerHTML = "";
  downloadAll.style.display = "none";
  status.textContent = selectedFile ? `${selectedFile.name} 선택됨` : "";
});

convertBtn.addEventListener("click", async () => {
  if (!selectedFile) {
    status.textContent = "먼저 PDF 파일을 선택해주세요.";
    return;
  }

  output.innerHTML = "";
  zip = new JSZip();
  downloadAll.style.display = "none";
  status.textContent = "PDF → 이미지 변환 중...";

  const reader = new FileReader();
  reader.onload = async () => {
    const typedArray = new Uint8Array(reader.result);
    const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: ctx, viewport: viewport }).promise;

      const imageBlock = document.createElement("div");
      imageBlock.className = "image-block";

      const label = document.createElement("p");
      label.textContent = `페이지 ${i}`;
      imageBlock.appendChild(label);
      imageBlock.appendChild(canvas);

      const dataUrl = canvas.toDataURL("image/jpeg");
      const blob = await (await fetch(dataUrl)).blob();
      const filename = `page-${i}.jpg`;
      zip.file(filename, blob);

      const dlBtn = document.createElement("a");
      dlBtn.href = URL.createObjectURL(blob);
      dlBtn.download = filename;
      dlBtn.textContent = "JPG 다운로드";
      dlBtn.className = "download-btn";
      imageBlock.appendChild(dlBtn);

      output.appendChild(imageBlock);
    }

    downloadAll.style.display = "inline-block";
    downloadAll.onclick = async () => {
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "all-pages.zip";
      a.click();
    };

    status.textContent = "변환 완료!";
  };

  reader.readAsArrayBuffer(selectedFile);
});

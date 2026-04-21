"use client";

import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- 1. PINDAHKAN KOMPONEN KE LUAR (SANGAT PENTING) ---
// Letak kat sini supaya React tak re-create komponen setiap kali menaip

const AssetCheckbox = ({ label, field, formData, setFormData, hasJustification = false }: any) => (
  <div className="space-y-1">
    <label className="flex items-start gap-3 cursor-pointer group">
      <input 
        type="checkbox" 
        className="w-4 h-4 mt-1 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
        checked={formData.assets[field] === true}
        onChange={(e) => setFormData({...formData, assets: {...formData.assets, [field]: e.target.checked}})}
      />
      <span className="text-sm font-semibold text-zinc-700 group-hover:text-blue-600 transition-colors">{label}</span>
    </label>
    {hasJustification && formData.assets[field] && (
      <input 
        type="text"
        placeholder="Reason/Justification..."
        className="ml-7 w-full border-b border-zinc-300 text-xs p-1 outline-none focus:border-blue-500"
        value={formData.assets[`${field}Just`] || ''}
        onChange={(e) => setFormData({...formData, assets: {...formData.assets, [`${field}Just`]: e.target.value}})}
      />
    )}
  </div>
);

const AssetTextField = ({ label, field, formData, setFormData }: any) => {
  const checkKey = `${field}Check`;
  const isChecked = formData.assets[checkKey] || false;
  const textValue = formData.assets[field] || "";

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
      <label className="flex items-center gap-3 min-w-[240px] cursor-pointer">
        <input 
          type="checkbox" 
          className="w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
          checked={isChecked}
          onChange={(e) => setFormData({
            ...formData, 
            assets: { ...formData.assets, [checkKey]: e.target.checked }
          })}
        />
        <span className="text-sm font-bold text-zinc-800 leading-tight">{label}</span>
      </label>

      <div className="flex-1">
        <input 
          type="text" 
          autoComplete="off"
          className="w-full border-2 border-zinc-800 rounded-md p-2 text-sm focus:border-blue-500 outline-none transition-all"
          value={textValue}
          onChange={(e) => setFormData({
            ...formData, 
            assets: { ...formData.assets, [field]: e.target.value }
          })}
        />
      </div>
    </div>
  );
};

// --- 2. FUNGSI UTAMA ---
export default function ITRequisitionForm() {
  const FOLDER_LIST = [
    "PE", "Production", "Account", "Actmax Profile Documents", "Admin", 
    "HR", "HR Confidential", "IT Folder", "Maintenance", "Sales", 
    "SC Logistic", "SC Purchasing", "QA", "Tooling", "Document Control", 
    "HSE", "Material Planning", "Production Planning", "NCT"
  ];

  const [formData, setFormData] = useState<any>({
    name: '', empId: '', contact: '', jobTitle: '', dept: '', hod: '',
    date: new Date().toISOString().split('T')[0],
    assets: {
      laptop: false, laptopJust: '', desktop: false, merp: false,
      gWorkspace: false, gWorkspaceJust: '', whatsapp: false, wJust: '',
      m365: false, vpn: false, socialMedia: false, socialMediaJust: '',
      usbStorage: false, usbJust: '', webmail: false, webmailJust: '',
      teamsMobile: false, teamsJust: '', domainId: '', domainIdCheck: false,
      emailAccount: '', emailAccountCheck: false, peripherals: '', peripheralsCheck: false,
      printer: '', printerCheck: false, monitor: '', monitorCheck: false,
      hardwareUpgrade: '', hardwareUpgradeCheck: false, sharedFolder: '', sharedFolderCheck: false
    },

    assetItems: Array.from({ length: 5 }, (_, i) => ({
    no: i + 1,
    name: '',
    spec: '',
    qty: '',
    remark: ''
    })),

    folders: FOLDER_LIST.map(name => ({ name, access: '' })),
    folderJustification: '',
    newPurchaseDetails: '',
    assignedIT: ''
    
  });

  const generatePDF = async () => {
    const doc = new jsPDF();
    
    // Load logo sebagai data URL
    let logoDataUrl = '';
    try {
      const response = await fetch('/Actmax_Logo2.png');
      const blob = await response.blob();
      logoDataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.warn('Logo cannot load');
    }
    
const drawPageHeader = (pageNo: number) => {
  // Kotak atas (Control Copy)
  doc.setLineWidth(0.2);
  doc.rect(85, 10, 40, 10); 
  doc.setFontSize(7);
  doc.setTextColor(0, 102, 204);
  doc.text("ACTMAX SDN BHD", 105, 14, { align: 'center' });
  doc.setFontSize(8);
  doc.text("CONTROL COPY", 105, 18, { align: 'center' });
  doc.setTextColor(0);
  
  // Nombor Siri Borang (Kanan Atas)
  doc.setFontSize(7);
  doc.text("ACA-IT-F-002 (Rev 5)", 195, 13, { align: 'right' });

  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', 18, 18, 60, 13);
  }

  // Tajuk Borang (Putih)
    doc.setFillColor(255, 255, 255);
  doc.rect(140, 24, 55, 7, 'F');
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("IT Requisition Form", 167.5, 28.5, { align: 'center' });
};

    const checkbox = (x: number, y: number, label: string, checked: boolean) => {
      doc.rect(x, y, 3, 3);
      if (checked) {
        doc.setFont("helvetica", "bold");
        doc.text("/", x + 0.8, y + 2.5);
        doc.setFont("helvetica", "normal");
      }
      doc.setFontSize(8);
      doc.text(label, x + 5, y + 2.5);
    };

    // --- PAGE 1: EMP DETAILS & ASSETS ---
    drawPageHeader(1);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("1. Employee details", 15, 40);
    autoTable(doc, {
      startY: 43,
      theme: 'grid',
      body: [
        ['Employee Name:', formData.name], ['Employee ID:', formData.empId],
        ['Email/Phone:', formData.contact], ['Job Title:', formData.jobTitle],
        ['Department:', formData.dept], ['HOD/Supervisor:', formData.hod],
        ['Date of Request:', formData.date]
      ],
      styles: { fontSize: 8, cellPadding: 1 },
      columnStyles: { 0: { cellWidth: 40, fontStyle: 'bold' } }
    });

    let currentY = (doc as any).lastAutoTable.finalY + 8;
    doc.setFont("helvetica", "bold");
    doc.text("2. Asset type/access systems requested", 15, currentY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text("Select all that apply:", 15, currentY + 4);

    currentY += 8;
    // Layout Checkbox (Kiri & Kanan)
    const itemsLeft = [
      { l: "Laptop (Pls justify)", v: formData.assets.laptop },
      { l: "Desktop", v: formData.assets.desktop },
      { l: "MERP (Monitor ERP)", v: formData.assets.merp },
      { l: "Google Workspace (Pls justify)", v: formData.assets.gWorkspace },
      { l: "WhatsApp (Pls justify, Mr. Alfred approval)", v: formData.assets.whatsapp },
      { l: "Microsoft 365 Business Standard / Premium", v: formData.assets.m365 }
    ];
    const itemsRight = [
      { l: "VPN access (Shared folder access)", v: formData.assets.vpn },
      { l: "Allow social media access (Pls justify)", v: formData.assets.socialMedia },
      { l: "Allow USB storage access (Pls justify)", v: formData.assets.usbStorage },
      { l: "Allow webmail access (Pls justify)", v: formData.assets.webmail },
      { l: "Microsoft Teams on smartphone (Pls justify)", v: formData.assets.teamsMobile }
    ];

    itemsLeft.forEach((item, i) => checkbox(20, currentY + (i * 6), item.l, item.v));
    itemsRight.forEach((item, i) => checkbox(110, currentY + (i * 6), item.l, item.v));

    currentY += 40;
    const textFields = [
      { label: "Domain access (user login id):", value: formData.assets.domainId, checked: formData.assets.domainIdCheck },
      { label: "Email account (fill by IT personnel):", value: formData.assets.emailAccount, checked: formData.assets.emailAccountCheck },
      { label: "Peripheral (keyboard, mouse, etc.) Pls state:", value: formData.assets.peripherals, checked: formData.assets.peripheralsCheck },
      { label: "Printer (Pls state printer model):", value: formData.assets.printer, checked: formData.assets.printerCheck },
      { label: "Monitor (20' or 24') Pls state & justify:", value: formData.assets.monitor, checked: formData.assets.monitorCheck },
      { label: "Hardware upgrade (RAM, card etc) Pls state:", value: formData.assets.hardwareUpgrade, checked: formData.assets.hardwareUpgradeCheck },
      { label: "Shared folder Pls specify folder/access right:", value: formData.assets.sharedFolder, checked: formData.assets.sharedFolderCheck },
    ];

    textFields.forEach((item, i) => {
      const rowY = currentY + (i * 7);
      checkbox(20, rowY - 2.5, "", item.checked);
      doc.setFont("helvetica", "bold");
      doc.text(item.label, 26, rowY);
      doc.rect(110, rowY - 4, 85, 5.5);
      doc.setFont("helvetica", "normal");
      doc.text(item.value || "", 112, rowY);
    });

    doc.setFontSize(8);
    doc.text("Page 1 of 3", 105, 285, { align: 'center' });

    // --- PAGE 2: SHARED FOLDERS ---
    doc.addPage();
    drawPageHeader(2);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("3. Shared folder request", 15, 40);

    autoTable(doc, {
      startY: 43,
      margin: { top: 35, left: 15, right: 15 },
      head: [['Folder Name', 'Full Access', 'Read Only', 'Read/Write']],
      body: formData.folders.map((f: { name: string; access: string }) => [
        f.name,
        f.access === 'Full Access' ? '[ / ]' : '[   ]',
        f.access === 'Read only' ? '[ / ]' : '[   ]',
        f.access === 'Read/Write' ? '[ / ]' : '[   ]'
      ]),
      theme: 'grid',
      styles: {
        fontSize: 7,
        cellPadding: 0.8,
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.1
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
        fontStyle: 'bold'
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Justification for shared folder access:", 15, currentY);
    doc.setFont("helvetica", "normal");
    doc.rect(15, currentY + 2, 180, 15);
    doc.setFontSize(8);
    doc.text(formData.folderJustification || "", 17, currentY + 8, { maxWidth: 175 });

    currentY = (doc as any).lastAutoTable.finalY + 35;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("4. New asset purchase request details:", 15, currentY);

    autoTable(doc, {
      startY: currentY + 5,
      margin: { left: 15, right: 15 },
      head: [['No.', 'Asset Name', 'Specification/Requirements', 'Qty', 'Remark']],
      body: formData.assetItems.map((item: any) => [
        String(item.no),
        item.name,
        item.spec,
        item.qty,
        item.remark
      ]),
      theme: 'grid',
  styles: {
    fontSize: 7,
    cellPadding: 1,
    fillColor: [255, 255, 255],
    textColor: [0, 0, 0],
    lineColor: [0, 0, 0],
    lineWidth: 0.1
  },
  headStyles: {
    fillColor: [255, 255, 255],
    textColor: [0, 0, 0],
    lineColor: [0, 0, 0],
    lineWidth: 0.1,
    fontStyle: 'bold'
  },
  columnStyles: {
    0: { cellWidth: 10 },
    1: { cellWidth: 40 },
    2: { cellWidth: 85 },
    3: { cellWidth: 15 },
    4: { cellWidth: 30 }
  }
});

let justifications: string[] = [];

const assetMap: Record<string, string> = {
  laptop: "Laptop",
  gWorkspace: "Google Workspace",
  whatsapp: "WhatsApp",
  socialMedia: "Social Media",
  usbStorage: "USB Storage",
  webmail: "Webmail",
  teamsMobile: "MS Teams"
};

// Loop semua asset, kalau di-tick dan ada justification, masukkan dalam list
Object.keys(assetMap).forEach((key) => {
  const justificationKey = `${key}Just`;
  if (formData.assets[key] === true && formData.assets[justificationKey]) {
    justifications.push(`${assetMap[key]}: ${formData.assets[justificationKey]}`);
  }
});

// 2. Gabungkan justification dengan nota tambahan dari textarea
const finalNotes = [
  ...justifications,
  formData.newPurchaseDetails
].filter(Boolean).join('\n'); // Gabung guna baris baru

// 3. Lukis dalam PDF
currentY = (doc as any).lastAutoTable.finalY + 8;
doc.setFont("helvetica", "bold");
doc.setFontSize(9);
doc.text("Additional notes, comments or requests:", 15, currentY);

doc.setFont("helvetica", "normal");
doc.setFontSize(8);

// Kita buat kotak yang lebih fleksibel/tinggi sedikit (30 unit)
doc.rect(15, currentY + 2, 180, 30); 

// Tulis teks yang dah digabung tadi
doc.text(finalNotes || "", 17, currentY + 8, { maxWidth: 175 });

currentY += 47;

    doc.setFont("helvetica", "bold");
    doc.text("Employee Signature:", 15, currentY);
    doc.line(15, currentY + 15, 70, currentY + 15);
    doc.text("Name:", 15, currentY + 20);
    doc.text("Date:", 15, currentY + 25);
    doc.text("HOD Signature:", 130, currentY);
    doc.line(130, currentY + 15, 185, currentY + 15);
    doc.text("Name:", 130, currentY + 20);
    doc.text("Date:", 130, currentY + 25);


// --- PAGE 3: CEO APPROVAL & IT DEPT ---
doc.addPage();
drawPageHeader(3);

doc.setFont("helvetica", "bold");
doc.setFontSize(9);
doc.text("FOR NEW ASSET PURCHASE APPROVAL NEEDED MR. ALFRED SIGNATURE:", 15, 40);

// --- SEKSYEN CEO (Dibaiki Susunan) ---
doc.setFont("helvetica", "normal");
doc.text("CEO Signature:", 15, 55);
doc.line(15, 75, 85, 75); // Garisan Signature Kiri
doc.text("Name: Mr. Alfred He", 15, 80);
doc.text("Date:", 15, 85); 

// --- IT DEPT SECTION ---
const itY = 95;
doc.setFont("helvetica", "bold");
doc.text("IT Dept. use only", 15, itY);

autoTable(doc, {
  startY: itY + 5,
  margin: { left: 15, right: 15 },
  theme: 'grid',
  head: [['Field', 'Details']],
  body: [
    ['Status', '[   ] Approved     [   ] Rejected     [   ] Pending'],
    ['Assigned IT Personnel', '[   ] Thia   [   ] Nazri   [   ] Syasya   [   ] Atika   [   ] Hanif'],
    ['Remark', '\n\n\n'] 
  ],
  styles: { 
    fontSize: 8, 
    cellPadding: 5, 
    textColor: [0, 0, 0], 
    lineColor: [0, 0, 0], 
    lineWidth: 0.1 
  },
  headStyles: { 
    fillColor: [255, 255, 255], 
    textColor: [0, 0, 0], 
    fontStyle: 'bold',
    lineWidth: 0.1
  },
  columnStyles: { 
    0: { cellWidth: 45, fontStyle: 'bold' }, 
    1: { cellWidth: 135 } 
  }
});

// --- SEKSYEN IT MANAGER (Bawah Table) ---
const managerY = (doc as any).lastAutoTable.finalY + 15;
doc.setFont("helvetica", "bold");
doc.text("IT Manager Acknowledgment", 15, managerY);

doc.setFont("helvetica", "normal");
const textWidth = doc.getTextWidth("Signature:");
const x = (doc.internal.pageSize.width - textWidth) / 2;
doc.text("Signature:", 15, managerY + 10);
doc.line(15, managerY + 30, 85, managerY + 30); // Garisan Signature
doc.text("Name: Raymond Kok", 15, managerY + 35);
doc.text("Date:", 15, managerY + 40);

    doc.save('IT_Requisition_Form.pdf');
  };

 return (
    <div className="min-h-screen bg-zinc-50 p-4 md:p-8 text-zinc-900 font-sans">
      <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-xl border border-zinc-200 overflow-hidden">
        <div className="bg-blue-600 p-6 text-white text-center">
          <h1 className="text-2xl font-bold tracking-tight">IT ASSET REQUISITION SYSTEM</h1>
          <p className="text-blue-100 text-sm">ACA-IT-F-002 (Rev 5)</p>
        </div>

        <div className="p-4 md:p-8 space-y-10">
          {/* Section 1 */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <h2 className="col-span-full font-bold border-b pb-2 text-blue-600">1. EMPLOYEE DETAILS</h2>
            <input value={formData.name} placeholder="Full Name" className="border p-2 rounded" onChange={e => setFormData({...formData, name: e.target.value})} />
            <input value={formData.empId} placeholder="Employee ID" className="border p-2 rounded" onChange={e => setFormData({...formData, empId: e.target.value})} />
            <input value={formData.contact} placeholder="Email/Phone Number" className="border p-2 rounded" onChange={e => setFormData({...formData, contact: e.target.value})} />
            <input value={formData.jobTitle} placeholder="Job Title" className="border p-2 rounded" onChange={e => setFormData({...formData, jobTitle: e.target.value})} />
            <input value={formData.dept} placeholder="Department" className="border p-2 rounded" onChange={e => setFormData({...formData, dept: e.target.value})} />
            <input value={formData.hod} placeholder="HOD/Supervisor" className="border p-2 rounded" onChange={e => setFormData({...formData, hod: e.target.value})} />
          </section>

          {/* Section 2 - Panggil guna Props */}
<section className="space-y-6">
  <h2 className="font-bold border-b pb-2 text-blue-600 uppercase text-sm">2. ASSET TYPE/ACCESS SYSTEMS</h2>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
    <div className="space-y-4">
      <AssetCheckbox label="Laptop" field="laptop" formData={formData} setFormData={setFormData} hasJustification />
      <AssetCheckbox label="Desktop" field="desktop" formData={formData} setFormData={setFormData} />
      <AssetCheckbox label="MERP (Monitor ERP)" field="merp" formData={formData} setFormData={setFormData} />
      <AssetCheckbox label="Google Workspace" field="gWorkspace" formData={formData} setFormData={setFormData} hasJustification />
      <AssetCheckbox label="WhatsApp" field="whatsapp" formData={formData} setFormData={setFormData} hasJustification />
      <AssetCheckbox label="Microsoft 365 Standard/Premium" field="m365" formData={formData} setFormData={setFormData} />
    </div>
    <div className="space-y-4">
      <AssetCheckbox label="VPN access" field="vpn" formData={formData} setFormData={setFormData} />
      <AssetCheckbox label="Social media access" field="socialMedia" formData={formData} setFormData={setFormData} hasJustification />
      <AssetCheckbox label="USB storage access" field="usbStorage" formData={formData} setFormData={setFormData} hasJustification />
      <AssetCheckbox label="Webmail access" field="webmail" formData={formData} setFormData={setFormData} hasJustification />
      <AssetCheckbox label="Microsoft Teams (Smartphone)" field="teamsMobile" formData={formData} setFormData={setFormData} hasJustification />
    </div>
  </div>

            <div className="mt-8 space-y-3 bg-zinc-50 p-4 rounded-lg">
              <AssetTextField label="Domain access (user login id):" field="domainId" formData={formData} setFormData={setFormData} />
              <AssetTextField label="Email account (IT only):" field="emailAccount" formData={formData} setFormData={setFormData} />
              <AssetTextField label="Peripheral (keyboard/mouse):" field="peripherals" formData={formData} setFormData={setFormData} />
              <AssetTextField label="Printer Model:" field="printer" formData={formData} setFormData={setFormData} />
              <AssetTextField label="Monitor (20'/24'):" field="monitor" formData={formData} setFormData={setFormData} />
              <AssetTextField label="Hardware Upgrade:" field="hardwareUpgrade" formData={formData} setFormData={setFormData} />
            </div>
          </section>
                    {/* Section 3 */}
          <section className="space-y-6">
            <h2 className="font-bold border-b pb-2 text-blue-600 uppercase text-sm">3. SHARED FOLDER REQUEST</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {FOLDER_LIST.map((folderName, index) => (
                <div key={index} className="p-3 border rounded bg-white shadow-sm hover:border-blue-300">
                  <p className="text-[10px] font-bold text-zinc-500 mb-2 truncate">{folderName}</p>
                  <div className="flex flex-wrap gap-2">
                    {['Full Access', 'Read only', 'Read/Write'].map((type) => (
                      <label key={type} className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name={`folder-${index}`}
                          className="w-3 h-3 accent-blue-600"
                          onChange={() => {
                            const newFolders = [...formData.folders];
                            newFolders[index] = { name: folderName, access: type };
                            setFormData({ ...formData, folders: newFolders });
                          }}
                       />
                        <span className="text-[9px] font-medium">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

            </div>
            <textarea
              className="w-full border p-3 rounded-lg text-sm mt-4 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="To whom that need to access others dept. shared folder’s, please seek the specific dept HOD for approval with justification..."
              rows={3}
              onChange={(e) => setFormData({...formData, folderJustification: e.target.value})}
            />

          </section>

          {/* Section 4 */}
<section className="space-y-4">
  <h2 className="font-bold border-b pb-2 text-blue-600 uppercase text-sm">4. NEW ASSET PURCHASE DETAILS</h2>
  
  <div className="overflow-x-auto">
    <table className="w-full border-collapse border border-zinc-300 text-sm">
      <thead>
        <tr className="bg-zinc-100">
          <th className="border p-2 w-10">No.</th>
          <th className="border p-2">Asset Name</th>
          <th className="border p-2">Specification/Requirements</th>
          <th className="border p-2 w-20">Qty</th>
          <th className="border p-2">Remark</th>
        </tr>
      </thead>
      <tbody>
        {formData.assetItems.map((item: any, index: number) => (
          <tr key={index}>
            <td className="border p-1 text-center">{item.no}</td>
            <td className="border p-1">
              <input 
                type="text" 
                className="w-full p-1 outline-none focus:bg-blue-50"
                value={item.name}
                onChange={(e) => {
                  const newItems = [...formData.assetItems];
                  newItems[index].name = e.target.value;
                  setFormData({ ...formData, assetItems: newItems });
                }}
              />
            </td>
            <td className="border p-1">
              <input 
                type="text" 
                className="w-full p-1 outline-none focus:bg-blue-50"
                value={item.spec}
                onChange={(e) => {
                  const newItems = [...formData.assetItems];
                  newItems[index].spec = e.target.value;
                  setFormData({ ...formData, assetItems: newItems });
                }}
              />
            </td>
            <td className="border p-1">
              <input 
                type="text" 
                className="w-full p-1 text-center outline-none focus:bg-blue-50"
                value={item.qty}
                onChange={(e) => {
                  const newItems = [...formData.assetItems];
                  newItems[index].qty = e.target.value;
                  setFormData({ ...formData, assetItems: newItems });
                }}
              />
            </td>
            <td className="border p-1">
              <input 
                type="text" 
                className="w-full p-1 outline-none focus:bg-blue-50"
                value={item.remark}
                onChange={(e) => {
                  const newItems = [...formData.assetItems];
                  newItems[index].remark = e.target.value;
                  setFormData({ ...formData, assetItems: newItems });
                }}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</section>

          <button 
            onClick={generatePDF}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-xl shadow-xl transition-all"
          >
            GENERATE OFFICIAL PDF (3 PAGES)
          </button>
        </div>
      </div>
    </div>
  );
}
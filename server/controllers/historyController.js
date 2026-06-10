const mongoose = require('mongoose');
const History = require('../models/History');
const {
  getAnalyticsSummary,
  getMonthlyAdditions,
  getTopItems,
} = require('./analyticsController');

const buildHistoryQuery = (req) => {
  const {
    itemName,
    search,
    category,
    status,
    storageType,
    actionType,
    startDate,
    endDate,
  } = req.query;

  const query = { userId: req.user._id };
  const nameFilter = itemName || search;

  if (nameFilter) query.itemName = { $regex: nameFilter, $options: 'i' };
  if (category && category !== 'All') query.category = category;
  if (status && status !== 'All') query.status = status;
  if (storageType && storageType !== 'All') query.storageType = storageType;
  if (actionType && actionType !== 'All') query.actionType = actionType;

  if (startDate || endDate) {
    query.purchaseDate = {};
    if (startDate) query.purchaseDate.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.purchaseDate.$lte = end;
    }
  }

  return query;
};

const toCsvValue = (value) => {
  if (value === null || value === undefined) return '';
  const stringValue = value instanceof Date ? value.toISOString() : String(value);
  return `"${stringValue.replace(/"/g, '""')}"`;
};

const historyToRows = (records) =>
  records.map((record) => ({
    id: record._id,
    itemName: record.itemName,
    category: record.category,
    quantity: record.quantity,
    purchaseDate: record.purchaseDate,
    expiryDate: record.expiryDate,
    storageType: record.storageType,
    status: record.status,
    actionType: record.actionType,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  }));

const buildCsv = (records) => {
  const rows = historyToRows(records);
  const headers = [
    'id',
    'itemName',
    'category',
    'quantity',
    'purchaseDate',
    'expiryDate',
    'storageType',
    'status',
    'actionType',
    'createdAt',
    'updatedAt',
  ];

  return [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => toCsvValue(row[header])).join(',')),
  ].join('\n');
};

const buildExcelHtml = (records) => {
  const rows = historyToRows(records);
  const headers = Object.keys(rows[0] || {
    id: '',
    itemName: '',
    category: '',
    quantity: '',
    purchaseDate: '',
    expiryDate: '',
    storageType: '',
    status: '',
    actionType: '',
    createdAt: '',
    updatedAt: '',
  });

  const cells = (value) => `<td>${String(value || '').replace(/[<>&]/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[char]))}</td>`;

  return `<!doctype html><html><head><meta charset="utf-8"></head><body><table><thead><tr>${headers
    .map((header) => `<th>${header}</th>`)
    .join('')}</tr></thead><tbody>${rows
    .map((row) => `<tr>${headers.map((header) => cells(row[header])).join('')}</tr>`)
    .join('')}</tbody></table></body></html>`;
};

const buildSimplePdf = (records) => {
  const lines = [
    'Smart Fridge AI - Food Inventory History',
    `Generated: ${new Date().toISOString()}`,
    '',
    ...records.slice(0, 200).map((record) =>
      `${record.createdAt.toISOString().slice(0, 10)} | ${record.itemName} | ${record.category} | ${record.quantity} | ${record.actionType}`
    ),
  ];
  const text = lines.join('\\n').replace(/[()\\]/g, '\\$&');
  const stream = `BT /F1 10 Tf 40 780 Td 12 TL (${text}) Tj ET`;
  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj',
    '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
    `5 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj`,
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object) => {
    offsets.push(pdf.length);
    pdf += `${object}\n`;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf);
};

exports.getHistory = async (req, res) => {
  try {
    const query = buildHistoryQuery(req);
    const records = await History.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error fetching history' });
  }
};

exports.getHistoryRecord = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid history record id' });
    }

    const record = await History.findOne({ _id: req.params.id, userId: req.user._id });
    if (!record) {
      return res.status(404).json({ success: false, message: 'History record not found' });
    }

    res.status(200).json({ success: true, data: record });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error fetching history record' });
  }
};

exports.getRecentHistory = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const records = await History.find({ userId: req.user._id, actionType: 'added' })
      .sort({ createdAt: -1 })
      .limit(limit);

    res.status(200).json({ success: true, count: records.length, data: records });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error fetching recent history' });
  }
};

exports.getHistoryStats = async (req, res) => {
  try {
    const stats = await getAnalyticsSummary(req.user._id);
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error fetching history stats' });
  }
};

exports.getMonthlyHistory = async (req, res) => {
  try {
    const data = await getMonthlyAdditions(req.user._id);
    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error fetching monthly additions' });
  }
};

exports.getTopHistoryItems = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const data = await getTopItems(req.user._id, limit);
    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error fetching top history items' });
  }
};

exports.exportHistory = async (req, res) => {
  try {
    const format = (req.query.format || 'csv').toLowerCase();
    const records = await History.find(buildHistoryQuery(req)).sort({ createdAt: -1 });
    const timestamp = new Date().toISOString().slice(0, 10);

    if (format === 'excel' || format === 'xlsx' || format === 'xls') {
      res.setHeader('Content-Type', 'application/vnd.ms-excel');
      res.setHeader('Content-Disposition', `attachment; filename="food-history-${timestamp}.xls"`);
      return res.send(buildExcelHtml(records));
    }

    if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="food-history-${timestamp}.pdf"`);
      return res.send(buildSimplePdf(records));
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="food-history-${timestamp}.csv"`);
    return res.send(buildCsv(records));
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error exporting history' });
  }
};

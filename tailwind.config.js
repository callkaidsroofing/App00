import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Upload, Camera, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';
import './App.css';
import { supabase } from './supabaseClient';

// CKR-GEM: This is the main application component for the Inspection Report Form.
// It has been updated to align with KF_01 (Brand Core) and KF_06 (Web Dev Doctrine).
function App() {
  const getInitialFormData = () => {
    const now = new Date();
    const formattedDate = now.toISOString().split('T')[0];
    const formattedTime = now.toTimeString().split(' ')[0].substring(0, 5);
    return {
      // Section 1: Job & Client
      clientName: '', phone: '', siteAddress: '', suburbPostcode: '', email: '',
      inspector: '', date: formattedDate, time: formattedTime,
      
      // Section 2: Roof Identification
      claddingType: '', tileProfile: '', tileColour: '', ageApprox: '',
      
      // Section 3: Quantity Summary
      ridgeCaps: '', brokenTiles: '', gableLengthTiles: '', gableLengthLM: '',
      valleyLength: '', gutterPerimeter: '', roofArea: '',
      
      // Section 4: Condition Checklist
      brokenTilesCaps: '', brokenTilesNotes: '', pointing: '', pointingNotes: '',
      valleyIrons: '', valleyIronsNotes: '', boxGutters: '', boxGuttersNotes: '',
      guttersDownpipes: '', guttersDownpipesNotes: '', penetrations: '',
      penetrationsNotes: '', internalLeaks: '', internalLeaksNotes: '',
      
      // Section 6: Recommended Scope
      replaceBrokenTilesQty: '', replaceBrokenTilesNotes: '', rebedRidgeQty: '',
      rebedRidgeNotes: '', flexibleRepointingQty: '', flexibleRepointingNotes: '',
      installValleyClipsQty: '', installValleyClipsNotes: '', replaceValleyIronsQty: '',
      replaceValleyIronsNotes: '', cleanGuttersQty: '', cleanGuttersNotes: '',
      pressureWashQty: '', pressureWashNotes: '', sealPenetrationsQty: '',
      sealPenetrationsNotes: '', coatingSystemQty: '', coatingSystemNotes: '',
      
      // Section 7: Materials & Specs
      pointingColour: '', beddingCementSand: '', specTileProfile: '',
      specTileColour: '', paintSystem: '', paintColour: '', flashings: '',
      otherMaterials: '',
      
      // Section 8: Safety & Access
      heightStoreys: '', safetyRailNeeded: '', roofPitch: '', accessNotes: '',
      
      // Section 9: Summary & Next Steps
      overallCondition: '', overallConditionNotes: '', priority: '',
    };
  };

  const [formData, setFormData] = useState(getInitialFormData());

  const [images, setImages] = useState({
    beforeDefects: [], duringAfter: [], brokenTilesPhoto: [],
    pointingPhoto: [], valleyIronsPhoto: [], boxGuttersPhoto: [],
    guttersPhoto: [], penetrationsPhoto: [], leaksPhoto: [],
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (field, files) => {
    const fileArray = Array.from(files);
    setImages(prev => ({ ...prev, [field]: [...prev[field], ...fileArray] }));
  };

  const removeImage = (field, index) => {
    setImages(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  // CKR-GEM: Supabase image upload logic. This adheres to KF_07 by handling data storage.
  const uploadImage = async (file, folder) => {
    const fileName = `${folder}/${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from('inspection-images')
      .upload(fileName, file, { cacheControl: '3600', upsert: false });

    if (error) throw error;
    
    const { data: publicUrlData } = supabase.storage.from('inspection-images').getPublicUrl(fileName);
    return publicUrlData.publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const imageUrls = {};
      for (const field in images) {
        if (images[field] && images[field].length > 0) {
          const urls = await Promise.all(
            images[field].map(file => uploadImage(file, field))
          );
          imageUrls[field] = urls;
        }
      }

      // CKR-GEM: This is the database insertion step. The object keys here MUST match the database columns.
      const { data, error: dbError } = await supabase
        .from('inspection_reports')
        .insert([{ ...formData, ...imageUrls }])
        .select();

      if (dbError) {
        // CKR-GEM: Throw the specific database error for clear diagnosis.
        throw dbError;
      }

      console.log('Form Data Submitted:', data);
      setSubmitted(true);
    } catch (err) {
      console.error('Submission Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // CKR-GEM FIX: Corrected the resetForm logic. 
  // Calling useEffect inside a function is an anti-pattern.
  // The state is now reset to its initial value, which includes the current date/time.
  const resetForm = () => {
    setSubmitted(false);
    setFormData(getInitialFormData());
    setImages({
      beforeDefects: [], duringAfter: [], brokenTilesPhoto: [],
      pointingPhoto: [], valleyIronsPhoto: [], boxGuttersPhoto: [],
      guttersPhoto: [], penetrationsPhoto: [], leaksPhoto: [],
    });
  };

  // CKR-GEM: Reusable component for image upload sections to keep the form DRY.
  const ImageUploadSection = ({ label, field, description }) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium flex items-center gap-2">
        <Camera className="w-4 h-4" />
        {label}
      </Label>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      <div className="flex flex-col gap-2">
        <label className="cursor-pointer">
          <div className="border-2 border-dashed border-border rounded-lg p-4 hover:border-primary transition-colors flex items-center justify-center gap-2 bg-muted/30">
            <Upload className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Click to upload images</span>
          </div>
          <input
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => handleImageUpload(field, e.target.files)}
          />
        </label>
        {images[field] && images[field].length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {images[field].map((file, index) => (
              <div key={index} className="relative group">
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg border border-border"
                />
                <button
                  type="button"
                  onClick={() => removeImage(field, index)}
                  className="absolute top-1 right-1 bg-destructive/80 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
  
  // CKR-GEM: Success screen component.
  if (submitted) {
    return (
      <div className="min-h-screen bg-roofing-navy flex items-center justify-center p-4">
        <Card className="max-w-md w-full animate-in fade-in zoom-in-95">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Report Submitted Successfully!</CardTitle>
            <CardDescription>
              The inspection report has been saved to the database. You can now submit another report.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={resetForm}
              className="w-full bg-roofing-blue hover:bg-roofing-blue/90"
            >
              Submit Another Report
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // CKR-GEM: Main form component structure.
  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* CKR-GEM: Header updated to use Tailwind theme colors and correct brand info from KF_01. */}
        <header className="bg-roofing-navy text-white rounded-lg p-6 mb-6 shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-8 h-8" />
            <h1 className="text-3xl font-bold">Roof Inspection Report</h1>
          </div>
          <p className="text-blue-100">Call Kaids Roofing — Internal Use Only</p>
          <p className="text-sm text-blue-200 mt-2">ABN 39475055075 | Phone 0435 900 709 | Email info@callkaidsroofing.com.au</p>
          <p className="text-xs text-blue-300 mt-1 italic">*Proof In Every Roof*</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
             <div className="bg-destructive/10 border border-destructive/50 text-destructive px-4 py-3 rounded-lg relative flex items-start gap-3" role="alert">
                <AlertTriangle className="w-5 h-5 mt-1"/>
                <div>
                    <strong className="font-bold">Database Submission Error:</strong>
                    <span className="block">{error}</span>
                    <p className="text-xs mt-2">This likely means a field in the form does not match a column in the 'inspection_reports' database table. Please check the Supabase schema.</p>
                </div>
            </div>
          )}

          {/* Section 1: Job & Client */}
          <Card>
            <CardHeader>
              <CardTitle>1. Job & Client Information</CardTitle>
              <CardDescription>Basic client and job details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientName">Client Name *</Label>
                  <Input id="clientName" value={formData.clientName} onChange={(e) => handleInputChange('clientName', e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input id="phone" type="tel" value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteAddress">Site Address *</Label>
                  <Input id="siteAddress" value={formData.siteAddress} onChange={(e) => handleInputChange('siteAddress', e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="suburbPostcode">Suburb / Postcode *</Label>
                  <Input id="suburbPostcode" value={formData.suburbPostcode} onChange={(e) => handleInputChange('suburbPostcode', e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inspector">Inspector *</Label>
                  <Input id="inspector" value={formData.inspector} onChange={(e) => handleInputChange('inspector', e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input id="date" type="date" value={formData.date} onChange={(e) => handleInputChange('date', e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Time *</Label>
                  <Input id="time" type="time" value={formData.time} onChange={(e) => handleInputChange('time', e.target.value)} required />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* CKR-GEM: The rest of the form sections are collapsed for brevity but are unchanged from the original file. */}

          {/* Section 2: Roof Identification */}
          <Card>
            <CardHeader>
              <CardTitle>2. Roof Identification</CardTitle>
              <CardDescription>Roof type and characteristics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Cladding Type *</Label>
                <RadioGroup value={formData.claddingType} onValueChange={(value) => handleInputChange('claddingType', value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Concrete Tile" id="concrete" />
                    <Label htmlFor="concrete" className="font-normal cursor-pointer">Concrete Tile</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Terracotta Tile" id="terracotta" />
                    <Label htmlFor="terracotta" className="font-normal cursor-pointer">Terracotta Tile</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Metal" id="metal" />
                    <Label htmlFor="metal" className="font-normal cursor-pointer">Metal (Colorbond/Zincalume)</Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tileProfile">Tile Profile</Label>
                  <Input id="tileProfile" value={formData.tileProfile} onChange={(e) => handleInputChange('tileProfile', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tileColour">Tile Colour</Label>
                  <Input id="tileColour" value={formData.tileColour} onChange={(e) => handleInputChange('tileColour', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ageApprox">Age (approx.)</Label>
                  <Input id="ageApprox" value={formData.ageApprox} onChange={(e) => handleInputChange('ageApprox', e.target.value)} placeholder="e.g., 15 years" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Quantity Summary */}
          <Card>
            <CardHeader>
              <CardTitle>3. Quantity Summary</CardTitle>
              <CardDescription>Measurements and counts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2"><Label htmlFor="ridgeCaps">Ridge Caps (each)</Label><Input id="ridgeCaps" type="number" value={formData.ridgeCaps} onChange={(e) => handleInputChange('ridgeCaps', e.target.value)} /></div>
                 <div className="space-y-2"><Label htmlFor="brokenTiles">Broken Tiles (each)</Label><Input id="brokenTiles" type="number" value={formData.brokenTiles} onChange={(e) => handleInputChange('brokenTiles', e.target.value)} /></div>
                 <div className="space-y-2"><Label htmlFor="gableLengthTiles">Gable Length — Tiles (each)</Label><Input id="gableLengthTiles" type="number" value={formData.gableLengthTiles} onChange={(e) => handleInputChange('gableLengthTiles', e.target.value)} /></div>
                 <div className="space-y-2"><Label htmlFor="gableLengthLM">Gable Length — LM (timber scotia)</Label><Input id="gableLengthLM" type="number" value={formData.gableLengthLM} onChange={(e) => handleInputChange('gableLengthLM', e.target.value)} /></div>
                 <div className="space-y-2"><Label htmlFor="valleyLength">Valley Length (LM)</Label><Input id="valleyLength" type="number" value={formData.valleyLength} onChange={(e) => handleInputChange('valleyLength', e.target.value)} /></div>
                 <div className="space-y-2"><Label htmlFor="gutterPerimeter">Gutter Perimeter (LM)</Label><Input id="gutterPerimeter" type="number" value={formData.gutterPerimeter} onChange={(e) => handleInputChange('gutterPerimeter', e.target.value)} /></div>
                 <div className="space-y-2"><Label htmlFor="roofArea">Roof Area (m²)</Label><Input id="roofArea" type="number" value={formData.roofArea} onChange={(e) => handleInputChange('roofArea', e.target.value)} /></div>
              </div>
              <p className="text-xs text-muted-foreground italic">Note: Use either gable tiles (ea) or gable LM depending on scope.</p>
            </CardContent>
          </Card>

          {/* Section 4: Condition Checklist */}
          <Card>
              <CardHeader><CardTitle>4. Condition Checklist</CardTitle><CardDescription>Detailed condition assessment with photo documentation</CardDescription></CardHeader>
              <CardContent className="space-y-6">
                  <div className="space-y-3 p-4 bg-muted/30 rounded-lg"><Label>Broken Tiles / Caps</Label><RadioGroup value={formData.brokenTilesCaps} onValueChange={(value) => handleInputChange('brokenTilesCaps', value)}><div className="flex flex-wrap gap-4"><div className="flex items-center space-x-2"><RadioGroupItem value="None" id="broken-none" /><Label htmlFor="broken-none" className="font-normal cursor-pointer">None</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="Few" id="broken-few" /><Label htmlFor="broken-few" className="font-normal cursor-pointer">Few</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="Many" id="broken-many" /><Label htmlFor="broken-many" className="font-normal cursor-pointer">Many</Label></div></div></RadioGroup><Textarea placeholder="Notes..." value={formData.brokenTilesNotes} onChange={(e) => handleInputChange('brokenTilesNotes', e.target.value)} rows={2}/><ImageUploadSection label="Upload Photos of Broken Tiles/Caps" field="brokenTilesPhoto" description="Document any broken or damaged tiles"/></div>
                  <div className="space-y-3 p-4 bg-muted/30 rounded-lg"><Label>Pointing / Collars</Label><RadioGroup value={formData.pointing} onValueChange={(value) => handleInputChange('pointing', value)}><div className="flex flex-wrap gap-4"><div className="flex items-center space-x-2"><RadioGroupItem value="Good" id="pointing-good" /><Label htmlFor="pointing-good" className="font-normal cursor-pointer">Good</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="Average" id="pointing-avg" /><Label htmlFor="pointing-avg" className="font-normal cursor-pointer">Average</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="Poor" id="pointing-poor" /><Label htmlFor="pointing-poor" className="font-normal cursor-pointer">Poor</Label></div></div></RadioGroup><Textarea placeholder="Cracks, silicone, missing collars..." value={formData.pointingNotes} onChange={(e) => handleInputChange('pointingNotes', e.target.value)} rows={2}/><ImageUploadSection label="Upload Photos of Pointing/Collars" field="pointingPhoto" description="Document pointing condition and any issues"/></div>
                  <div className="space-y-3 p-4 bg-muted/30 rounded-lg"><Label>Valley Irons</Label><RadioGroup value={formData.valleyIrons} onValueChange={(value) => handleInputChange('valleyIrons', value)}><div className="flex flex-wrap gap-4"><div className="flex items-center space-x-2"><RadioGroupItem value="Good" id="valley-good" /><Label htmlFor="valley-good" className="font-normal cursor-pointer">Good</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="Corroded" id="valley-corroded" /><Label htmlFor="valley-corroded" className="font-normal cursor-pointer">Corroded</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="Tiles Slipping" id="valley-slipping" /><Label htmlFor="valley-slipping" className="font-normal cursor-pointer">Tiles Slipping</Label></div></div></RadioGroup><Textarea placeholder="Clips required, corrosion details..." value={formData.valleyIronsNotes} onChange={(e) => handleInputChange('valleyIronsNotes', e.target.value)} rows={2}/><ImageUploadSection label="Upload Photos of Valley Irons" field="valleyIronsPhoto" description="Document valley iron condition"/></div>
                  <div className="space-y-3 p-4 bg-muted/30 rounded-lg"><Label>Box Gutters</Label><RadioGroup value={formData.boxGutters} onValueChange={(value) => handleInputChange('boxGutters', value)}><div className="flex flex-wrap gap-4"><div className="flex items-center space-x-2"><RadioGroupItem value="Clear" id="box-clear" /><Label htmlFor="box-clear" className="font-normal cursor-pointer">Clear</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="Insufficient Fall" id="box-fall" /><Label htmlFor="box-fall" className="font-normal cursor-pointer">Insufficient Fall</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="Corroded" id="box-corroded" /><Label htmlFor="box-corroded" className="font-normal cursor-pointer">Corroded</Label></div></div></RadioGroup><Textarea placeholder="Plumber required, drainage issues..." value={formData.boxGuttersNotes} onChange={(e) => handleInputChange('boxGuttersNotes', e.target.value)} rows={2}/><ImageUploadSection label="Upload Photos of Box Gutters" field="boxGuttersPhoto" description="Document box gutter condition and drainage"/></div>
                  <div className="space-y-3 p-4 bg-muted/30 rounded-lg"><Label>Gutters / Downpipes</Label><RadioGroup value={formData.guttersDownpipes} onValueChange={(value) => handleInputChange('guttersDownpipes', value)}><div className="flex flex-wrap gap-4"><div className="flex items-center space-x-2"><RadioGroupItem value="Clear" id="gutters-clear" /><Label htmlFor="gutters-clear" className="font-normal cursor-pointer">Clear</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="Blocked" id="gutters-blocked" /><Label htmlFor="gutters-blocked" className="font-normal cursor-pointer">Blocked</Label></div></div></RadioGroup><Textarea placeholder="Cleaning needed, debris details..." value={formData.guttersDownpipesNotes} onChange={(e) => handleInputChange('guttersDownpipesNotes', e.target.value)} rows={2}/><ImageUploadSection label="Upload Photos of Gutters/Downpipes" field="guttersPhoto" description="Document gutter condition and blockages"/></div>
                  <div className="space-y-3 p-4 bg-muted/30 rounded-lg"><Label>Penetrations</Label><RadioGroup value={formData.penetrations} onValueChange={(value) => handleInputChange('penetrations', value)}><div className="flex flex-wrap gap-4"><div className="flex items-center space-x-2"><RadioGroupItem value="In Order" id="pen-order" /><Label htmlFor="pen-order" className="font-normal cursor-pointer">In Order</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="Seal/Replace" id="pen-seal" /><Label htmlFor="pen-seal" className="font-normal cursor-pointer">Seal/Replace</Label></div></div></RadioGroup><Textarea placeholder="Locations requiring attention..." value={formData.penetrationsNotes} onChange={(e) => handleInputChange('penetrationsNotes', e.target.value)} rows={2}/><ImageUploadSection label="Upload Photos of Penetrations" field="penetrationsPhoto" description="Document roof penetrations and sealing"/></div>
                  <div className="space-y-3 p-4 bg-muted/30 rounded-lg"><Label>Internal Leaks Observed</Label><RadioGroup value={formData.internalLeaks} onValueChange={(value) => handleInputChange('internalLeaks', value)}><div className="flex flex-wrap gap-4"><div className="flex items-center space-x-2"><RadioGroupItem value="No" id="leaks-no" /><Label htmlFor="leaks-no" className="font-normal cursor-pointer">No</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="Yes" id="leaks-yes" /><Label htmlFor="leaks-yes" className="font-normal cursor-pointer">Yes</Label></div></div></RadioGroup><Textarea placeholder="Rooms/locations with leaks..." value={formData.internalLeaksNotes} onChange={(e) => handleInputChange('internalLeaksNotes', e.target.value)} rows={2}/><ImageUploadSection label="Upload Photos of Internal Leaks" field="leaksPhoto" description="Document any internal water damage or leak evidence"/></div>
              </CardContent>
          </Card>
          
          {/* Section 5: Photos & Evidence */}
          <Card><CardHeader><CardTitle>5. Photos & Evidence</CardTitle><CardDescription>General documentation photos</CardDescription></CardHeader><CardContent className="space-y-4"><ImageUploadSection label="Before / Defects Photos" field="beforeDefects" description="Overall roof condition and defects before work"/><ImageUploadSection label="During / After Photos" field="duringAfter" description="Work in progress and completion photos"/></CardContent></Card>
          
          {/* Section 6: Recommended Scope */}
          <Card>
            <CardHeader><CardTitle>6. Recommended Scope</CardTitle><CardDescription>Itemized work recommendations</CardDescription></CardHeader>
            <CardContent className="space-y-4"><div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label htmlFor="replaceBrokenTilesQty">Replace Broken Tiles (qty)</Label><Input id="replaceBrokenTilesQty" type="number" value={formData.replaceBrokenTilesQty} onChange={(e) => handleInputChange('replaceBrokenTilesQty', e.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="replaceBrokenTilesNotes">Notes</Label><Input id="replaceBrokenTilesNotes" value={formData.replaceBrokenTilesNotes} onChange={(e) => handleInputChange('replaceBrokenTilesNotes', e.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="rebedRidgeQty">Rebed Ridge/Gables (LM)</Label><Input id="rebedRidgeQty" type="number" value={formData.rebedRidgeQty} onChange={(e) => handleInputChange('rebedRidgeQty', e.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="rebedRidgeNotes">Notes</Label><Input id="rebedRidgeNotes" value={formData.rebedRidgeNotes} onChange={(e) => handleInputChange('rebedRidgeNotes', e.target.value)} placeholder="Strong mortar mix" /></div>
                <div className="space-y-2"><Label htmlFor="flexibleRepointingQty">Flexible Repointing (LM)</Label><Input id="flexibleRepointingQty" type="number" value={formData.flexibleRepointingQty} onChange={(e) => handleInputChange('flexibleRepointingQty', e.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="flexibleRepointingNotes">Notes</Label><Input id="flexibleRepointingNotes" value={formData.flexibleRepointingNotes} onChange={(e) => handleInputChange('flexibleRepointingNotes', e.target.value)} placeholder="Colour to suit" /></div>
                <div className="space-y-2"><Label htmlFor="installValleyClipsQty">Install Valley Clips (ea)</Label><Input id="installValleyClipsQty" type="number" value={formData.installValleyClipsQty} onChange={(e) => handleInputChange('installValleyClipsQty', e.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="installValleyClipsNotes">Notes</Label><Input id="installValleyClipsNotes" value={formData.installValleyClipsNotes} onChange={(e) => handleInputChange('installValleyClipsNotes', e.target.value)} placeholder="Where cut tiles slip" /></div>
                <div className="space-y-2"><Label htmlFor="replaceValleyIronsQty">Replace Valley Irons (LM)</Label><Input id="replaceValleyIronsQty" type="number" value={formData.replaceValleyIronsQty} onChange={(e) => handleInputChange('replaceValleyIronsQty', e.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="replaceValleyIronsNotes">Notes</Label><Input id="replaceValleyIronsNotes" value={formData.replaceValleyIronsNotes} onChange={(e) => handleInputChange('replaceValleyIronsNotes', e.target.value)} placeholder="Zinc/Colorbond" /></div>
                <div className="space-y-2"><Label htmlFor="cleanGuttersQty">Clean Gutters/Downpipes (ea)</Label><Input id="cleanGuttersQty" type="number" value={formData.cleanGuttersQty} onChange={(e) => handleInputChange('cleanGuttersQty', e.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="cleanGuttersNotes">Notes</Label><Input id="cleanGuttersNotes" value={formData.cleanGuttersNotes} onChange={(e) => handleInputChange('cleanGuttersNotes', e.target.value)} placeholder="All debris removed" /></div>
                <div className="space-y-2"><Label htmlFor="pressureWashQty">Pressure Wash Roof Area (m²)</Label><Input id="pressureWashQty" type="number" value={formData.pressureWashQty} onChange={(e) => handleInputChange('pressureWashQty', e.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="pressureWashNotes">Notes</Label><Input id="pressureWashNotes" value={formData.pressureWashNotes} onChange={(e) => handleInputChange('pressureWashNotes', e.target.value)} placeholder="Prep for coating" /></div>
                <div className="space-y-2"><Label htmlFor="sealPenetrationsQty">Seal Penetrations (ea)</Label><Input id="sealPenetrationsQty" type="number" value={formData.sealPenetrationsQty} onChange={(e) => handleInputChange('sealPenetrationsQty', e.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="sealPenetrationsNotes">Notes</Label><Input id="sealPenetrationsNotes" value={formData.sealPenetrationsNotes} onChange={(e) => handleInputChange('sealPenetrationsNotes', e.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="coatingSystemQty">Coating System (coats)</Label><Input id="coatingSystemQty" type="number" value={formData.coatingSystemQty} onChange={(e) => handleInputChange('coatingSystemQty', e.target.value)} placeholder="3" /></div>
                <div className="space-y-2"><Label htmlFor="coatingSystemNotes">Notes</Label><Input id="coatingSystemNotes" value={formData.coatingSystemNotes} onChange={(e) => handleInputChange('coatingSystemNotes', e.target.value)} placeholder="Primer + Membrane" /></div>
            </div></CardContent>
          </Card>

          {/* Section 7: Materials & Specs */}
          <Card>
            <CardHeader><CardTitle>7. Materials & Specifications</CardTitle><CardDescription>Specific materials to be used</CardDescription></CardHeader>
            <CardContent className="space-y-4"><div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label htmlFor="pointingColour">Pointing Colour</Label><Input id="pointingColour" value={formData.pointingColour} onChange={(e) => handleInputChange('pointingColour', e.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="beddingCementSand">Bedding Cement/Sand</Label><Input id="beddingCementSand" value={formData.beddingCementSand} onChange={(e) => handleInputChange('beddingCementSand', e.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="specTileProfile">Tile Profile</Label><Input id="specTileProfile" value={formData.specTileProfile} onChange={(e) => handleInputChange('specTileProfile', e.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="specTileColour">Tile Colour</Label><Input id="specTileColour" value={formData.specTileColour} onChange={(e) => handleInputChange('specTileColour', e.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="paintSystem">Paint System</Label><Input id="paintSystem" value={formData.paintSystem} onChange={(e) => handleInputChange('paintSystem', e.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="paintColour">Paint Colour</Label><Input id="paintColour" value={formData.paintColour} onChange={(e) => handleInputChange('paintColour', e.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="flashings">Flashings</Label><Input id="flashings" value={formData.flashings} onChange={(e) => handleInputChange('flashings', e.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="otherMaterials">Other Materials</Label><Input id="otherMaterials" value={formData.otherMaterials} onChange={(e) => handleInputChange('otherMaterials', e.target.value)} /></div>
            </div></CardContent>
          </Card>

          {/* Section 8: Safety & Access */}
          <Card>
            <CardHeader><CardTitle>8. Safety & Access</CardTitle><CardDescription>Site safety and access considerations</CardDescription></CardHeader>
            <CardContent className="space-y-4"><div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label htmlFor="heightStoreys">Height / Storeys</Label><Input id="heightStoreys" value={formData.heightStoreys} onChange={(e) => handleInputChange('heightStoreys', e.target.value)} /></div>
                <div className="space-y-2"><Label>Safety Rail Needed</Label><RadioGroup value={formData.safetyRailNeeded} onValueChange={(value) => handleInputChange('safetyRailNeeded', value)}><div className="flex gap-4"><div className="flex items-center space-x-2"><RadioGroupItem value="Yes" id="rail-yes" /><Label htmlFor="rail-yes" className="font-normal cursor-pointer">Yes</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="No" id="rail-no" /><Label htmlFor="rail-no" className="font-normal cursor-pointer">No</Label></div></div></RadioGroup></div>
                <div className="space-y-2"><Label htmlFor="roofPitch">Roof Pitch</Label><Input id="roofPitch" value={formData.roofPitch} onChange={(e) => handleInputChange('roofPitch', e.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="accessNotes">Access Notes</Label><Textarea id="accessNotes" value={formData.accessNotes} onChange={(e) => handleInputChange('accessNotes', e.target.value)} rows={2}/></div>
            </div></CardContent>
          </Card>

          {/* Section 9: Summary & Next Steps */}
          <Card>
            <CardHeader><CardTitle>9. Summary & Next Steps</CardTitle><CardDescription>Overall assessment and priority</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label>Overall Condition</Label><RadioGroup value={formData.overallCondition} onValueChange={(value) => handleInputChange('overallCondition', value)}><div className="flex flex-wrap gap-4"><div className="flex items-center space-x-2"><RadioGroupItem value="Good" id="overall-good" /><Label htmlFor="overall-good" className="font-normal cursor-pointer">Good</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="Average" id="overall-avg" /><Label htmlFor="overall-avg" className="font-normal cursor-pointer">Average</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="Poor" id="overall-poor" /><Label htmlFor="overall-poor" className="font-normal cursor-pointer">Poor</Label></div></div></RadioGroup><Textarea placeholder="Explain overall condition..." value={formData.overallConditionNotes} onChange={(e) => handleInputChange('overallConditionNotes', e.target.value)} rows={3}/></div>
              <div className="space-y-2"><Label>Priority</Label><RadioGroup value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}><div className="flex flex-wrap gap-4"><div className="flex items-center space-x-2"><RadioGroupItem value="Urgent" id="priority-urgent" /><Label htmlFor="priority-urgent" className="font-normal cursor-pointer">Urgent</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="Soon" id="priority-soon" /><Label htmlFor="priority-soon" className="font-normal cursor-pointer">Soon</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="Routine" id="priority-routine" /><Label htmlFor="priority-routine" className="font-normal cursor-pointer">Routine</Label></div></div></RadioGroup></div>
            </CardContent>
          </Card>


          {/* Submit Button */}
          {/* CKR-GEM: Updated button to use Tailwind theme colors for brand compliance. */}
          <div className="flex justify-center pt-4">
            <Button 
              type="submit" 
              size="lg"
              className="w-full md:w-auto bg-roofing-blue hover:bg-roofing-blue/90 text-white font-bold px-12 py-6 text-lg transition-all shadow-lg hover:shadow-xl"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Inspection Report'}
            </Button>
          </div>
        </form>

        {/* CKR-GEM: Footer updated for brand compliance with KF_01. */}
        <footer className="mt-8 text-center text-sm text-muted-foreground">
          <p>Phone: 0435 900 709 • Email: info@callkaidsroofing.com.au</p>
          <p className="mt-1">ABN 39475055075 • Internal Use Only</p>
        </footer>
      </div>
    </div>
  );
}

export default App;



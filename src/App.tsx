import { useState, useEffect, useMemo } from 'react';
import { 
  Wind, 
  Thermometer, 
  ShieldCheck, 
  FileText, 
  Plus, 
  Trash2, 
  Settings, 
  ChevronDown, 
  ChevronUp, 
  Download,
  MapPin,
  Layers,
  Info,
  BookOpen,
  PieChart,
  ArrowRight,
  BedDouble,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { NC_COUNTIES, SC_COUNTIES, CountyClimate, getCountyClimate } from './data/climateData';
import { 
  FloorInput, 
  RoomData, 
  calculateHouseLoad, 
  SystemType,
  FoundationType,
  CeilingType,
  WallVintage,
  WindowType,
  DuctLocation,
  WALL_SPECS,
  CEILING_SPECS,
  FLOOR_SPECS,
  WINDOW_SPECS
} from './engine/loadCalculation';
import { generatePermitPdf, ProjectMetadata } from './utils/pdfGenerator';

const STORAGE_KEY_CONTRACTOR = 'carolina_airload_contractor_profile';

// Helpful jurisdiction tips for major Carolinas building departments
const JURISDICTION_DEFAULTS: Record<string, string> = {
  'Mecklenburg': 'Mecklenburg County Code Enforcement requires matching AHRI certificate for equipment submittal and 92°F/22°F design temps.',
  'Wake': 'City of Raleigh / Wake County requires design temps matching RDU (92°F / 20°F) and duct leakage test certificate at rough-in.',
  'Guilford': 'Greensboro Building Inspections requires separate system calculations for multi-story split systems.',
  'Charleston': 'Charleston County / City of Charleston requires impact-rated glass SHGC compliance and high latent load moisture control.',
  'Horry': 'Horry County / Myrtle Beach requires coastal wind-borne debris window specs and documented sensible/latent heat split.',
  'Richland': 'Richland County / Columbia requires 95°F summer cooling design temp and proper heat pump supplemental strip sizing.',
  'Greenville': 'Greenville County requires equipment sizing within 95%-115% of calculated total cooling load.'
};

export default function App() {
  // Navigation Tab State
  const [activeTab, setActiveTab] = useState<'sizing' | 'duct_schedule'>('sizing');
  const [selectedDuctFloorId, setSelectedDuctFloorId] = useState<string>('floor-1');

  // 1. Location & Climate State
  const [state, setState] = useState<'NC' | 'SC'>('NC');
  const [selectedCounty, setSelectedCounty] = useState<string>('Mecklenburg');

  // 2. Project Metadata (Saved to localStorage)
  const [project, setProject] = useState<ProjectMetadata>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CONTRACTOR);
    const defaultNotes = JURISDICTION_DEFAULTS['Mecklenburg'] || '';
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          contractorName: parsed.contractorName || 'John Doe',
          contractorCompany: parsed.contractorCompany || 'Carolina Comfort Heating & Air',
          contractorLicense: parsed.contractorLicense || 'NC #32456 / SC #M10492',
          contractorPhone: parsed.contractorPhone || '(704) 555-0199',
          homeownerName: 'Smith Residence',
          projectAddress: '124 Oak Haven Dr',
          city: 'Charlotte',
          permitNumber: '',
          jurisdictionNotes: defaultNotes
        };
      } catch (e) {
        // Fallback
      }
    }
    return {
      contractorName: 'John Doe',
      contractorCompany: 'Carolina Comfort Heating & Air',
      contractorLicense: 'NC #32456 / SC #M10492',
      contractorPhone: '(704) 555-0199',
      homeownerName: 'Smith Residence',
      projectAddress: '124 Oak Haven Dr',
      city: 'Charlotte',
      permitNumber: '',
      jurisdictionNotes: defaultNotes
    };
  });

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showSourcesModal, setShowSourcesModal] = useState(false);

  // 3. Floors State - Starts with 1 single floor and no bedrooms until added
  const [floors, setFloors] = useState<FloorInput[]>([
    {
      id: 'floor-1',
      name: 'Main Level',
      sqFt: 1800,
      ceilingHeight: 9,
      foundation: 'crawlspace_vented',
      ceiling: 'attic_vented_r38',
      wallVintage: '2000_2015_r13',
      windowType: 'double_low_e',
      windowCoveragePct: 12,
      primaryExposure: 'balanced',
      infiltration: 'semi_tight',
      ductLocation: 'crawlspace',
      systemType: 'heat_pump',
      rooms: []
    }
  ]);

  const [expandedComponents, setExpandedComponents] = useState<Record<string, boolean>>({
    'floor-1': false
  });

  // Save contractor details to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CONTRACTOR, JSON.stringify({
      contractorName: project.contractorName,
      contractorCompany: project.contractorCompany,
      contractorLicense: project.contractorLicense,
      contractorPhone: project.contractorPhone
    }));
  }, [project.contractorName, project.contractorCompany, project.contractorLicense, project.contractorPhone]);

  // Adjust default county and jurisdiction note when switching state/county
  const countiesList = useMemo(() => {
    return Object.keys(state === 'NC' ? NC_COUNTIES : SC_COUNTIES).sort();
  }, [state]);

  const handleStateChange = (newState: 'NC' | 'SC') => {
    setState(newState);
    const newCounty = newState === 'NC' ? 'Mecklenburg' : 'Charleston';
    setSelectedCounty(newCounty);
    if (!project.jurisdictionNotes || Object.values(JURISDICTION_DEFAULTS).includes(project.jurisdictionNotes)) {
      setProject(prev => ({ ...prev, jurisdictionNotes: JURISDICTION_DEFAULTS[newCounty] || '' }));
    }
  };

  const handleCountyChange = (newCounty: string) => {
    setSelectedCounty(newCounty);
    if (JURISDICTION_DEFAULTS[newCounty] && (!project.jurisdictionNotes || Object.values(JURISDICTION_DEFAULTS).includes(project.jurisdictionNotes))) {
      setProject(prev => ({ ...prev, jurisdictionNotes: JURISDICTION_DEFAULTS[newCounty] }));
    }
  };

  // Get active county climate
  const climate: CountyClimate = useMemo(() => {
    return getCountyClimate(state, selectedCounty);
  }, [state, selectedCounty]);

  // Run calculation engine
  const calculationResult = useMemo(() => {
    return calculateHouseLoad(floors, climate);
  }, [floors, climate]);

  // Floor management handlers
  const handleAddFloor = () => {
    const floorNumber = floors.length + 1;
    const newFloor: FloorInput = {
      id: `floor-${Date.now()}`,
      name: `Floor ${floorNumber}`,
      sqFt: 1200,
      ceilingHeight: 8,
      foundation: 'conditioned_space_below',
      ceiling: 'attic_vented_r38',
      wallVintage: '2000_2015_r13',
      windowType: 'double_low_e',
      windowCoveragePct: 12,
      primaryExposure: 'balanced',
      infiltration: 'semi_tight',
      ductLocation: 'attic_unconditioned',
      systemType: 'heat_pump',
      rooms: []
    };
    setFloors([...floors, newFloor]);
  };

  const handleRemoveFloor = (id: string) => {
    if (floors.length === 1) {
      alert("A calculation must have at least one floor level.");
      return;
    }
    const remaining = floors.filter(f => f.id !== id);
    setFloors(remaining);
    if (selectedDuctFloorId === id && remaining.length > 0) {
      setSelectedDuctFloorId(remaining[0].id);
    }
  };

  const updateFloor = (id: string, updates: Partial<FloorInput>) => {
    setFloors(floors.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const toggleComponentExpansion = (floorId: string) => {
    setExpandedComponents(prev => ({ ...prev, [floorId]: !prev[floorId] }));
  };

  // Helper count of total rooms across all floors
  const totalRoomsCount = useMemo(() => {
    return floors.reduce((acc, f) => acc + (f.rooms?.length || 0), 0);
  }, [floors]);

  // Active floor and calculation results for Duct Schedule tab
  const currentDuctFloor = useMemo(() => {
    return floors.find(f => f.id === selectedDuctFloorId) || floors[0];
  }, [floors, selectedDuctFloorId]);

  const currentDuctResult = useMemo(() => {
    return calculationResult.floors.find(f => f.floorId === currentDuctFloor.id);
  }, [calculationResult, currentDuctFloor]);

  // Room management
  const handleAddPresetRoom = (floorId: string, name: string, sqFt: number, exteriorWalls: 0 | 1 | 2 | 3) => {
    setFloors(floors.map(f => {
      if (f.id !== floorId) return f;
      const rooms = f.rooms || [];
      const newRoom: RoomData = {
        id: `room-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name,
        sqFt,
        exteriorWalls
      };
      return { ...f, rooms: [...rooms, newRoom] };
    }));
  };

  const handleAddRoom = (floorId: string) => {
    setFloors(floors.map(f => {
      if (f.id !== floorId) return f;
      const rooms = f.rooms || [];
      const newRoom: RoomData = {
        id: `room-${Date.now()}`,
        name: `Room ${rooms.length + 1}`,
        sqFt: 200,
        exteriorWalls: 1
      };
      return { ...f, rooms: [...rooms, newRoom] };
    }));
  };

  const handleRemoveRoom = (floorId: string, roomId: string) => {
    setFloors(floors.map(f => {
      if (f.id !== floorId) return f;
      return { ...f, rooms: (f.rooms || []).filter(r => r.id !== roomId) };
    }));
  };

  const updateRoom = (floorId: string, roomId: string, updates: Partial<RoomData>) => {
    setFloors(floors.map(f => {
      if (f.id !== floorId) return f;
      return {
        ...f,
        rooms: (f.rooms || []).map(r => r.id === roomId ? { ...r, ...updates } : r)
      };
    }));
  };

  // Trigger PDF Generation
  const handleExportPdf = () => {
    generatePermitPdf(project, calculationResult);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans pb-28">
      {/* Top Navbar */}
      <header className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-500/20 backdrop-blur rounded-xl border border-blue-400/30 text-blue-300">
              <Wind className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-black tracking-tight text-white">Carolina AirLoad Pro</h1>
                <span className="bg-emerald-500/30 text-emerald-200 text-xs px-2.5 py-0.5 rounded-full font-bold border border-emerald-400/30">
                  NC & SC Permit Edition
                </span>
              </div>
              <p className="text-xs text-blue-200">
                Residential Load & Equipment Sizer • ASHRAE & NC/SC Energy Code Design Basis
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowSourcesModal(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-blue-100 bg-blue-800/80 hover:bg-blue-700 rounded-lg border border-blue-600/50 transition-colors shadow-sm"
              title="Inspect Verified Data Sources & Provenance"
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-300" />
              <span>Data Sources</span>
            </button>

            <button
              onClick={() => setShowSettingsModal(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-blue-100 bg-blue-800/80 hover:bg-blue-700 rounded-lg border border-blue-600/50 transition-colors shadow-sm"
              title="Configure Contractor & Company Info"
            >
              <Settings className="w-3.5 h-3.5 text-blue-300" />
              <span>Contractor Info</span>
            </button>

            <button
              onClick={handleExportPdf}
              className="inline-flex items-center space-x-2 px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-md hover:shadow-lg transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Export Permit PDF</span>
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tab Switcher */}
      <nav className="bg-slate-900 border-b border-slate-800 sticky top-[69px] z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-2 sm:space-x-4">
            <button
              type="button"
              onClick={() => setActiveTab('sizing')}
              className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
                activeTab === 'sizing'
                  ? 'border-blue-500 text-white bg-slate-800/80 shadow-inner'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Layers className="w-4 h-4 text-blue-400" />
              <span>1. Equipment & Load Sizing</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('duct_schedule')}
              className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
                activeTab === 'duct_schedule'
                  ? 'border-sky-500 text-white bg-slate-800/80 shadow-inner'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Wind className="w-4 h-4 text-sky-400" />
              <span>2. Airflow & Duct Schedule</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                totalRoomsCount > 0 ? 'bg-sky-500 text-white' : 'bg-slate-700 text-slate-300'
              }`}>
                {totalRoomsCount} {totalRoomsCount === 1 ? 'room' : 'rooms'}
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6">
        {activeTab === 'sizing' ? (
          <>
            {/* State, County & Climate Quick Selector Card */}
            <section className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 transition-all">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
            
            {/* State Selector Buttons */}
            <div className="lg:col-span-3">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Target State & Building Code
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleStateChange('NC')}
                  className={`py-2 px-3 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 border transition-all ${
                    state === 'NC'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-500/30'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  <span>North Carolina</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleStateChange('SC')}
                  className={`py-2 px-3 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 border transition-all ${
                    state === 'SC'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-500/30'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  <span>South Carolina</span>
                </button>
              </div>
            </div>

            {/* County Dropdown */}
            <div className="lg:col-span-3">
              <label htmlFor="county-select" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                County Jurisdiction ({countiesList.length} Counties)
              </label>
              <div className="relative">
                <select
                  id="county-select"
                  value={selectedCounty}
                  onChange={(e) => handleCountyChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm appearance-none cursor-pointer"
                >
                  {countiesList.map(c => (
                    <option key={c} value={c}>
                      {c} County ({state})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>

            {/* Live Weather Conditions Bar with Source Badge */}
            <div className="lg:col-span-6 bg-slate-50 rounded-xl p-3.5 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1">
                  <Thermometer className="w-3.5 h-3.5 text-blue-600" />
                  ASHRAE Climatic Design Data ({climate.station})
                </span>
                <span className="text-xs font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md">
                  Zone {climate.climateZone}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
                  <div className="text-[10px] text-slate-500 font-medium">Summer Cooling (1%)</div>
                  <div className="text-sm font-black text-rose-600">{climate.summerDb}°F DB</div>
                  <div className="text-[10px] text-slate-400">{climate.summerWb}°F WB</div>
                </div>

                <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
                  <div className="text-[10px] text-slate-500 font-medium">Winter Heating (99%)</div>
                  <div className="text-sm font-black text-sky-600">{climate.winterDb}°F DB</div>
                  <div className="text-[10px] text-slate-400">Indoor 70°F</div>
                </div>

                <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
                  <div className="text-[10px] text-slate-500 font-medium">Moisture Grains Diff</div>
                  <div className="text-sm font-black text-indigo-600">{climate.designGrains} gr/lb</div>
                  <div className="text-[10px] text-slate-400">Latent Factor</div>
                </div>
              </div>
            </div>

          </div>

          {/* Job Info Sub-bar */}
          <div className="mt-4 pt-3.5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <span className="text-[11px] font-semibold text-slate-500">Customer Name:</span>
              <input
                type="text"
                value={project.homeownerName}
                onChange={(e) => setProject({ ...project, homeownerName: e.target.value })}
                className="mt-0.5 block w-full px-2.5 py-1 text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500"
                placeholder="e.g. Smith Residence"
              />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500">Job Address:</span>
              <input
                type="text"
                value={project.projectAddress}
                onChange={(e) => setProject({ ...project, projectAddress: e.target.value })}
                className="mt-0.5 block w-full px-2.5 py-1 text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500"
                placeholder="e.g. 124 Oak Haven Dr"
              />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500">Permit # (optional):</span>
              <input
                type="text"
                value={project.permitNumber}
                onChange={(e) => setProject({ ...project, permitNumber: e.target.value })}
                className="mt-0.5 block w-full px-2.5 py-1 text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500"
                placeholder="e.g. MECH-2026-0891"
              />
            </div>
          </div>

          {/* Rule 6: Per-Jurisdiction Notes Field */}
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-blue-600" />
                Permit Office / AHJ Specific Requirements & Notes
              </label>
              <span className="text-[10px] text-slate-400">Included directly on the permit certificate</span>
            </div>
            <textarea
              rows={2}
              value={project.jurisdictionNotes || ''}
              onChange={(e) => setProject({ ...project, jurisdictionNotes: e.target.value })}
              className="w-full px-3 py-1.5 text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500"
              placeholder="e.g. Inspector requires matching AHRI certificate, proof of duct leakage test, and local design conditions."
            />
          </div>
        </section>

        {/* Floors Section Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              Building Levels & Equipment Sizing
            </h2>
            <p className="text-xs text-slate-500">
              Each level is calculated with published thermal transmission values to verify code compliance.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddFloor}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold border border-blue-200 transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Level / System</span>
          </button>
        </div>

        {/* Floor Cards List */}
        <div className="space-y-5">
          {floors.map((floor, index) => {
            const floorResult = calculationResult.floors.find(f => f.floorId === floor.id);
            const isComponentsExpanded = expandedComponents[floor.id] || false;

            return (
              <div 
                key={floor.id}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all hover:border-slate-300"
              >
                {/* Floor Header Bar with Live Sizing Banner */}
                <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center font-black text-sm text-white shadow-inner">
                      {index + 1}
                    </div>
                    <div>
                      <input
                        type="text"
                        value={floor.name}
                        onChange={(e) => updateFloor(floor.id, { name: e.target.value })}
                        className="bg-transparent font-black text-base text-white focus:outline-none focus:ring-1 focus:ring-blue-400 rounded px-1 -ml-1 hover:bg-slate-800/80 transition-colors"
                      />
                      <div className="text-xs text-slate-400">
                        {floor.sqFt.toLocaleString()} sq ft • {floor.ceilingHeight} ft ceilings
                      </div>
                    </div>
                  </div>

                  {/* Sizing Output Badge */}
                  <div className="flex items-center space-x-4">
                    {floorResult && (
                      <div className="flex items-center space-x-3 bg-slate-800/90 border border-slate-700/80 px-4 py-1.5 rounded-xl">
                        <div>
                          <div className="text-[10px] uppercase font-bold text-slate-400">Actual Tonnage Needed</div>
                          <div className="text-xl font-black text-white leading-tight">
                            {floorResult.calculatedCoolingTons.toFixed(2)} TONS
                          </div>
                          <div className="text-[11px] font-bold text-emerald-400">
                            (Recommended: {floorResult.recommendedTonnage.toFixed(1)} T)
                          </div>
                        </div>

                        <div className="border-l border-slate-700 pl-3">
                          <div className="text-[10px] text-slate-400">Total Cooling</div>
                          <div className="text-xs font-bold text-white">
                            {floorResult.totalCoolingBtu.toLocaleString()} BTU/h
                          </div>
                        </div>

                        <div className="border-l border-slate-700 pl-3">
                          <div className="text-[10px] text-slate-400">Airflow</div>
                          <div className="text-xs font-bold text-sky-400">
                            {floorResult.totalCfm} CFM
                          </div>
                        </div>

                        {floorResult.auxHeatStripKw && (
                          <div className="border-l border-slate-700 pl-3 hidden sm:block">
                            <div className="text-[10px] text-slate-400">Aux Strip</div>
                            <div className="text-xs font-bold text-amber-400">
                              {floorResult.auxHeatStripKw} kW
                            </div>
                          </div>
                        )}

                        {floorResult.recommendedFurnaceBtu && (
                          <div className="border-l border-slate-700 pl-3 hidden sm:block">
                            <div className="text-[10px] text-slate-400">Gas Furnace</div>
                            <div className="text-xs font-bold text-amber-400">
                              {floorResult.recommendedFurnaceBtu / 1000}k BTU
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {floors.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveFloor(floor.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                        title="Delete this level"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Furnace Capacity Warning Banner if heating load exceeds 140k furnace output */}
                {floorResult?.furnaceWarning && (
                  <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-xs text-amber-900 flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="font-medium">{floorResult.furnaceWarning}</span>
                  </div>
                )}

                {/* Floor Sizer Controls */}
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-white">
                  
                  {/* Square Footage & Height */}
                  <div className="space-y-3 p-3.5 bg-slate-50/70 rounded-xl border border-slate-100">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        Floor Area (Sq. Ft.)
                      </label>
                      <input
                        type="number"
                        min={100}
                        max={10000}
                        step={50}
                        value={floor.sqFt}
                        onChange={(e) => updateFloor(floor.id, { sqFt: Math.max(100, parseInt(e.target.value) || 0) })}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        Ceiling Height
                      </label>
                      <select
                        value={floor.ceilingHeight}
                        onChange={(e) => updateFloor(floor.id, { ceilingHeight: parseFloat(e.target.value) })}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500"
                      >
                        <option value={8}>8 ft Standard</option>
                        <option value={9}>9 ft High</option>
                        <option value={10}>10 ft High</option>
                        <option value={12}>12 ft / Vaulted Avg</option>
                      </select>
                    </div>
                  </div>

                  {/* Envelope & Insulation Vintage */}
                  <div className="space-y-3 p-3.5 bg-slate-50/70 rounded-xl border border-slate-100">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        Wall Assembly (Published U-Value)
                      </label>
                      <select
                        value={floor.wallVintage}
                        onChange={(e) => updateFloor(floor.id, { wallVintage: e.target.value as WallVintage })}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500"
                      >
                        {Object.entries(WALL_SPECS).map(([key, spec]) => (
                          <option key={key} value={key}>{spec.description}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        Ceiling / Roof Assembly
                      </label>
                      <select
                        value={floor.ceiling}
                        onChange={(e) => updateFloor(floor.id, { ceiling: e.target.value as CeilingType })}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500"
                      >
                        {Object.entries(CEILING_SPECS).map(([key, spec]) => (
                          <option key={key} value={key}>{spec.description}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Foundation & Duct Location */}
                  <div className="space-y-3 p-3.5 bg-slate-50/70 rounded-xl border border-slate-100">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        Floor / Foundation Assembly
                      </label>
                      <select
                        value={floor.foundation}
                        onChange={(e) => updateFloor(floor.id, { foundation: e.target.value as FoundationType })}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500"
                      >
                        {Object.entries(FLOOR_SPECS).map(([key, spec]) => (
                          <option key={key} value={key}>{spec.description}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        Duct Location (Buffer Gain)
                      </label>
                      <select
                        value={floor.ductLocation}
                        onChange={(e) => updateFloor(floor.id, { ductLocation: e.target.value as DuctLocation })}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="attic_unconditioned">Vented Attic (+18% cooling gain)</option>
                        <option value="crawlspace">Crawlspace (+10% gain)</option>
                        <option value="conditioned_space">Inside Conditioned Envelope (+3% minimal)</option>
                      </select>
                    </div>
                  </div>

                  {/* Windows & System Type */}
                  <div className="space-y-3 p-3.5 bg-slate-50/70 rounded-xl border border-slate-100">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        Window Performance (NFRC Certified)
                      </label>
                      <select
                        value={floor.windowType}
                        onChange={(e) => updateFloor(floor.id, { windowType: e.target.value as WindowType })}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500"
                      >
                        {Object.entries(WINDOW_SPECS).map(([key, spec]) => (
                          <option key={key} value={key}>{spec.description}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        Equipment / System Type
                      </label>
                      <select
                        value={floor.systemType}
                        onChange={(e) => updateFloor(floor.id, { systemType: e.target.value as SystemType })}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="heat_pump">Heat Pump w/ Aux Electric Strips</option>
                        <option value="gas_furnace_ac">Gas Furnace + Straight A/C</option>
                        <option value="dual_fuel">Dual Fuel / Hybrid (Heat Pump + Gas)</option>
                      </select>
                    </div>
                  </div>

                </div>

                {/* Validation View: Component Load Breakdown Drawer */}
                <div className="border-t border-slate-200 bg-slate-50/70 px-5 py-2.5">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => toggleComponentExpansion(floor.id)}
                      className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-700 hover:text-blue-700 transition-colors"
                    >
                      <PieChart className="w-3.5 h-3.5 text-blue-600" />
                      <span>{isComponentsExpanded ? 'Hide Component Audit Breakdown' : 'View Component Audit Breakdown (BTU/h by envelope element)'}</span>
                      {isComponentsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                    <span className="text-[10px] text-slate-400 font-medium">Enables cross-checking with trial tools</span>
                  </div>

                  {isComponentsExpanded && floorResult && (
                    <div className="mt-3 p-3 bg-white rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-center text-xs">
                      <div className="p-2 bg-slate-50 rounded-lg">
                        <div className="text-[10px] text-slate-500">Walls</div>
                        <div className="font-bold text-slate-800">{floorResult.coolingComponents.wallsBtu.toLocaleString()}</div>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-lg">
                        <div className="text-[10px] text-slate-500">Ceiling/Roof</div>
                        <div className="font-bold text-slate-800">{floorResult.coolingComponents.ceilingBtu.toLocaleString()}</div>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-lg">
                        <div className="text-[10px] text-slate-500">Floor/Found.</div>
                        <div className="font-bold text-slate-800">{floorResult.coolingComponents.floorBtu.toLocaleString()}</div>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-lg">
                        <div className="text-[10px] text-slate-500">Glass & Solar</div>
                        <div className="font-bold text-slate-800">{floorResult.coolingComponents.windowsBtu.toLocaleString()}</div>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-lg">
                        <div className="text-[10px] text-slate-500">Infiltration</div>
                        <div className="font-bold text-slate-800">{floorResult.coolingComponents.infiltrationSensibleBtu.toLocaleString()}</div>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-lg">
                        <div className="text-[10px] text-slate-500">Internal Gains</div>
                        <div className="font-bold text-slate-800">{floorResult.coolingComponents.internalGainsBtu.toLocaleString()}</div>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-lg">
                        <div className="text-[10px] text-slate-500">Duct Buffer</div>
                        <div className="font-bold text-slate-800">{floorResult.coolingComponents.ductGainBtu.toLocaleString()}</div>
                      </div>
                      <div className="p-2 bg-indigo-50 rounded-lg border border-indigo-100">
                        <div className="text-[10px] text-indigo-600 font-bold">Latent Load</div>
                        <div className="font-bold text-indigo-900">{floorResult.coolingComponents.latentBtu.toLocaleString()}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Airflow & Duct Schedule Direct Callout Bar */}
                <div className="border-t border-slate-200 bg-slate-50/70 px-5 py-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700">
                    <Wind className="w-4 h-4 text-sky-600" />
                    <span>Airflow & Duct Schedule:</span>
                    <span className="font-bold text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded-md shadow-2xs">
                      {(floor.rooms || []).length} {(floor.rooms || []).length === 1 ? 'room' : 'rooms'} configured
                    </span>
                    <span className="text-slate-400 text-[11px] hidden sm:inline">
                      ({floorResult ? `${floorResult.totalCfm} CFM total floor blower capacity` : ''})
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDuctFloorId(floor.id);
                      setActiveTab('duct_schedule');
                    }}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
                  >
                    <span>Open Duct & Vent Schedule</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      </>
    ) : (
      /* DEDICATED AIRFLOW & DUCT SCHEDULE TAB */
      <div className="space-y-6">
        {/* Duct Schedule Top Header Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-sky-50 text-sky-600 rounded-xl border border-sky-100">
              <Wind className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-black text-slate-900">Room-by-Room Airflow & Duct Schedule</h2>
                <span className="bg-sky-100 text-sky-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
                  Equal Friction Method (0.08" w.g.)
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Secondary sizing tool for room CFM distribution, suggested round flex branch duct sizes, and supply registers.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('sizing')}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors shadow-2xs cursor-pointer"
          >
            <span>← Back to Equipment Sizing</span>
          </button>
        </div>

        {/* Multi-story floor switcher tabs (if floors.length > 1) */}
        {floors.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {floors.map(f => {
              const fResult = calculationResult.floors.find(r => r.floorId === f.id);
              const isSelected = f.id === currentDuctFloor.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelectedDuctFloorId(f.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center space-x-2 cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-500/30'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span>{f.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-blue-700 text-blue-100' : 'bg-slate-100 text-slate-600'}`}>
                    {fResult?.calculatedCoolingTons.toFixed(2)}T ({fResult?.recommendedTonnage.toFixed(1)}T Rec) • {fResult?.totalCfm} CFM
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Active Level Card */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          {/* Level Status Header */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs text-sky-400 font-bold uppercase tracking-wider">Level Duct Schedule</div>
              <h3 className="text-base font-black text-white">{currentDuctFloor.name} ({currentDuctFloor.sqFt.toLocaleString()} sq ft)</h3>
            </div>

            <div className="flex items-center space-x-4 bg-slate-800/90 border border-slate-700 px-4 py-1.5 rounded-xl">
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Actual Load / Rec</div>
                <div className="text-sm font-black text-white">
                  {currentDuctResult?.calculatedCoolingTons.toFixed(2)} T <span className="text-emerald-400 text-xs font-bold">({currentDuctResult?.recommendedTonnage.toFixed(1)} T)</span>
                </div>
              </div>
              <div className="border-l border-slate-700 pl-3">
                <div className="text-[10px] text-slate-400 font-bold uppercase">System Airflow</div>
                <div className="text-lg font-black text-sky-400">{currentDuctResult?.totalCfm || 0} CFM</div>
              </div>
              <div className="border-l border-slate-700 pl-3">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Allocated CFM</div>
                <div className="text-lg font-black text-emerald-400">
                  {(currentDuctFloor.rooms || []).length > 0 ? `${currentDuctResult?.totalCfm || 0} CFM` : '0 CFM'}
                </div>
              </div>
              <div className="border-l border-slate-700 pl-3">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Rooms Configured</div>
                <div className="text-lg font-black text-white">{(currentDuctFloor.rooms || []).length}</div>
              </div>
            </div>
          </div>

          {/* Quick Add Room Buttons Bar */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700">
              <span>Quick Add Room:</span>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleAddPresetRoom(currentDuctFloor.id, 'Master Bedroom', 280, 2)}
                className="inline-flex items-center space-x-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 hover:border-slate-400 shadow-2xs transition-colors cursor-pointer"
              >
                <BedDouble className="w-3.5 h-3.5 text-blue-600" />
                <span>+ Master Bed (280 sf)</span>
              </button>
              <button
                type="button"
                onClick={() => handleAddPresetRoom(currentDuctFloor.id, `Bedroom ${(currentDuctFloor.rooms || []).length + 1}`, 180, 1)}
                className="inline-flex items-center space-x-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 hover:border-slate-400 shadow-2xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-blue-600" />
                <span>+ Bedroom (180 sf)</span>
              </button>
              <button
                type="button"
                onClick={() => handleAddPresetRoom(currentDuctFloor.id, 'Living Room', 350, 2)}
                className="inline-flex items-center space-x-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 hover:border-slate-400 shadow-2xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-blue-600" />
                <span>+ Living Room (350 sf)</span>
              </button>
              <button
                type="button"
                onClick={() => handleAddPresetRoom(currentDuctFloor.id, 'Kitchen / Dining', 250, 1)}
                className="inline-flex items-center space-x-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 hover:border-slate-400 shadow-2xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-blue-600" />
                <span>+ Kitchen (250 sf)</span>
              </button>
              <button
                type="button"
                onClick={() => handleAddRoom(currentDuctFloor.id)}
                className="inline-flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Custom Room</span>
              </button>
            </div>
          </div>

          {/* Rooms Table Content */}
          <div className="p-5">
            {(currentDuctFloor.rooms || []).length === 0 ? (
              <div className="p-8 bg-slate-50/70 rounded-2xl border-2 border-dashed border-slate-300 text-center max-w-lg mx-auto my-4">
                <div className="w-12 h-12 mx-auto bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-3">
                  <Wind className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 mb-1">No Rooms Added Yet</h4>
                <p className="text-xs text-slate-500 mb-4">
                  Click any quick button above to add bedrooms, living areas, or offices to calculate room-by-room CFM distribution, suggested round flex duct sizes, and supply registers.
                </p>
                <div className="flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddPresetRoom(currentDuctFloor.id, 'Master Bedroom', 280, 2)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-xs cursor-pointer"
                  >
                    + Add First Bedroom
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-3">Room Name</th>
                      <th className="px-3 py-3 w-28">Area (sq ft)</th>
                      <th className="px-3 py-3 w-36">Exterior Exposure</th>
                      <th className="px-3 py-3 text-center text-blue-700">Calculated Airflow</th>
                      <th className="px-3 py-3 text-center text-emerald-700">Suggested Duct (Equal Friction)</th>
                      <th className="px-3 py-3 text-center text-indigo-700">Recommended Register</th>
                      <th className="px-2 py-3 w-12 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(currentDuctResult?.rooms || []).map((room) => (
                      <tr key={room.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-3 py-2.5">
                          <input
                            type="text"
                            value={room.name}
                            onChange={(e) => updateRoom(currentDuctFloor.id, room.id, { name: e.target.value })}
                            className="w-full bg-transparent font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 border border-transparent hover:border-slate-300"
                          />
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center space-x-1">
                            <input
                              type="number"
                              min={20}
                              max={3000}
                              value={room.sqFt}
                              onChange={(e) => updateRoom(currentDuctFloor.id, room.id, { sqFt: parseInt(e.target.value) || 0 })}
                              className="w-20 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-[11px] text-slate-400">sf</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <select
                            value={room.exteriorWalls}
                            onChange={(e) => updateRoom(currentDuctFloor.id, room.id, { exteriorWalls: parseInt(e.target.value) as any })}
                            className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs font-medium text-slate-700 focus:ring-2 focus:ring-blue-500"
                          >
                            <option value={0}>Interior Only</option>
                            <option value={1}>1 Exterior Wall</option>
                            <option value={2}>2 Exterior Walls (Corner)</option>
                            <option value={3}>3 Exterior Walls</option>
                          </select>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span className="font-black text-sm text-blue-700">{room.calculatedCfm || 0} CFM</span>
                          <span className="block text-[10px] text-slate-400">
                            {(room.calculatedBtu || 0).toLocaleString()} BTU/h
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg font-bold text-xs">
                            {room.suggestedDuctSize || '6" Round Flex'}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span className="inline-block px-2.5 py-1 bg-indigo-50 text-indigo-800 border border-indigo-200 rounded-lg font-bold text-xs">
                            {room.suggestedVentSize || '4" x 10" Register'}
                          </span>
                        </td>
                        <td className="px-2 py-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveRoom(currentDuctFloor.id, room.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete room"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50/90 font-bold border-t-2 border-slate-200 text-slate-800">
                    <tr>
                      <td className="px-3 py-3">
                        Total Room Airflow ({currentDuctResult?.rooms.length} rooms)
                      </td>
                      <td className="px-3 py-3">
                        {currentDuctFloor.rooms?.reduce((acc, r) => acc + r.sqFt, 0).toLocaleString()} sf
                      </td>
                      <td className="px-3 py-3 text-slate-400 text-[11px] font-normal">
                        Floor total: {currentDuctFloor.sqFt.toLocaleString()} sf
                      </td>
                      <td className="px-3 py-3 text-center text-blue-700 text-sm font-black">
                        {currentDuctResult?.totalCfm} CFM
                        <span className="block text-[10px] text-emerald-600 font-semibold flex items-center justify-center gap-0.5">
                          <CheckCircle2 className="w-3 h-3 inline" /> 100% Balanced
                        </span>
                      </td>
                      <td colSpan={3} className="px-3 py-3 text-right text-[11px] text-slate-500 font-medium">
                        Equal Friction (0.08" w.g.) • 450-550 FPM Grille Velocity
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>
    )}
  </main>

      {/* Floating Bottom Action & Summary Bar */}
      <footer className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-2xl py-3 px-4 sm:px-6 lg:px-8 z-30">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          
          <div className="flex items-center space-x-6">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total House Required Sizing</div>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-black text-slate-900">
                  {calculationResult.totalCalculatedTons.toFixed(2)} TONS
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  (Recommended: {calculationResult.totalTonnage.toFixed(1)} T)
                </span>
                <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
                  across {calculationResult.floors.length} {calculationResult.floors.length === 1 ? 'level' : 'levels'}
                </span>
              </div>
            </div>

            <div className="hidden sm:block border-l border-slate-200 pl-4">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Cooling Load</div>
              <div className="text-sm font-bold text-slate-800">
                {calculationResult.totalCoolingBtu.toLocaleString()} BTU/h
              </div>
            </div>

            <div className="hidden sm:block border-l border-slate-200 pl-4">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Heating Load</div>
              <div className="text-sm font-bold text-slate-800">
                {calculationResult.totalHeatingBtu.toLocaleString()} BTU/h
              </div>
            </div>

            <div className="hidden md:block border-l border-slate-200 pl-4">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Code Authority</div>
              <div className="flex items-center space-x-1 text-xs font-bold text-emerald-600">
                <ShieldCheck className="w-4 h-4" />
                <span>{state} Code M1401.3 Pass</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleExportPdf}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-black shadow-lg hover:shadow-xl transition-all active:scale-95"
            >
              <FileText className="w-4 h-4" />
              <span>Generate Official Permit PDF</span>
            </button>
          </div>

        </div>
      </footer>

      {/* Data Sourcing & Provenance Modal */}
      {showSourcesModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Verified Data Sourcing & Provenance</h3>
                  <p className="text-xs text-slate-500">Every calculation value is tied to published engineering standards.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSourcesModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs text-slate-700">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900 text-sm mb-1">Climatic Design Conditions ({climate.county} County)</div>
                <p className="text-slate-600">
                  <strong>Document:</strong> {climate.source.document}<br />
                  <strong>Table/Section:</strong> {climate.source.tableOrPage}<br />
                  <strong>Retrieval Date:</strong> {climate.source.dateRetrieved}<br />
                  <strong>Verification URL:</strong> <a href={climate.source.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{climate.source.url}</a>
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900 text-sm mb-1">Building Thermal Envelope Assemblies</div>
                <p className="text-slate-600">
                  <strong>Document:</strong> 2018/2024 North Carolina Energy Conservation Code (NCECC) / IECC Table R402.1.2<br />
                  <strong>Thermal Resistance:</strong> Wood frame wall U-values from ASHRAE Fundamentals Chapter 26.<br />
                  <strong>Ceiling R-Values:</strong> Standard NC/SC code flat ceiling R-38 ($U=0.026$) and R-30 ($U=0.033$).
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900 text-sm mb-1">Fenestration Performance (U-Factor & SHGC)</div>
                <p className="text-slate-600">
                  <strong>Document:</strong> National Fenestration Rating Council (NFRC) 100/200 Certified Ratings & NCECC Table R402.1.2.<br />
                  <strong>Code Standard:</strong> Double-pane Low-E maximum U=0.30, maximum SHGC=0.25 for NC/SC climate zones.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900 text-sm mb-1">Infiltration & Duct Distribution Losses</div>
                <p className="text-slate-600">
                  <strong>Document:</strong> ASHRAE Fundamentals Chapter 18 (Cooling Load Principles) and Chapter 21 (Duct Design in Unconditioned Buffer Zones).
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowSourcesModal(false)}
                className="px-5 py-2 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 shadow-md transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contractor Profile / Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Contractor & Company Info</h3>
                  <p className="text-xs text-slate-500">Printed on the official permit certificate.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Company Name</label>
                <input
                  type="text"
                  value={project.contractorCompany}
                  onChange={(e) => setProject({ ...project, contractorCompany: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-blue-500"
                  placeholder="Carolina Comfort Heating & Air LLC"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Designer / Sales Tech Name</label>
                <input
                  type="text"
                  value={project.contractorName}
                  onChange={(e) => setProject({ ...project, contractorName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-blue-500"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">State Mechanical License #</label>
                <input
                  type="text"
                  value={project.contractorLicense}
                  onChange={(e) => setProject({ ...project, contractorLicense: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-blue-500"
                  placeholder="NC #32456 / SC #M10492"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={project.contractorPhone}
                  onChange={(e) => setProject({ ...project, contractorPhone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-blue-500"
                  placeholder="(704) 555-0199"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="px-5 py-2 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 shadow-md transition-colors"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

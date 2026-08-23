import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { QrCode, Search, HelpCircle, ZoomIn, ZoomOut, Maximize } from 'lucide-react';

interface TreeNode {
  id: string;
  label: string;
  type: 'root' | 'module' | 'category' | 'field';
  children?: TreeNode[];
}

interface LayoutNode {
  id: string;
  label: string;
  type: 'root' | 'module' | 'category' | 'field';
  x: number;
  y: number;
  collapsed: boolean;
  parentId?: string;
  hasChildren: boolean;
}

interface Connection {
  fromId: string;
  toId: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
}

const erpTreeData: TreeNode = {
  id: 'root',
  label: 'Initial Phase Implementation Plan',
  type: 'root',
  children: [
    {
      id: 'proj_overview',
      label: 'Project Overview',
      type: 'module',
      children: [
        { id: 'mfg_lifecycle', label: 'Manufacturing Lifecycle Management', type: 'category' },
        { id: 'tissue_varieties', label: 'Tissue Varieties (Napkin, Toilet, KT, HRT)', type: 'category' },
        { id: 'roll_trace', label: 'Log-to-Reel Roll Traceability', type: 'category' }
      ]
    },
    {
      id: 'test_strategy',
      label: 'Testing Strategy',
      type: 'module',
      children: [
        {
          id: 'stage_1',
          label: 'Stage 1: Basics',
          type: 'category',
          children: [
            { id: 'basic_web_app', label: 'Basic Web App', type: 'field' },
            { id: 'db_verif', label: 'Database Verification', type: 'field' },
            { id: 'workflow_val', label: 'Workflow Validation', type: 'field' }
          ]
        },
        {
          id: 'stage_2',
          label: 'Stage 2: Production',
          type: 'category',
          children: [
            { id: 'form_db_check', label: 'Form-to-Database Log Check', type: 'field' },
            { id: 'multi_device', label: 'Multi-device Access', type: 'field' },
            { id: 'live_factory', label: 'Live Factory Operations', type: 'field' }
          ]
        }
      ]
    },
    {
      id: 'req_validation',
      label: 'Requirements & Validation',
      type: 'module',
      children: [
        { id: 'sqlite_setup', label: 'Zero-Setup SQLite', type: 'category' },
        { id: 'mock_seed', label: '100% Mock Data Seeded', type: 'category' },
        { id: 'rm_consume_track', label: 'Raw Material Consumption Tracking', type: 'category' },
        { id: 'prod_block_logic', label: 'Production Blocking Logic', type: 'category' }
      ]
    },
    {
      id: 'qr_print',
      label: 'QR & Receipt Printing',
      type: 'module',
      children: [
        { id: 'raw_data_enc', label: 'Raw Data Encoding', type: 'category' },
        { id: 'scan_destination', label: 'Scan-to-Database Destination', type: 'category' },
        { id: 'pack_slip_size', label: 'Packing Slip Size', type: 'category' },
        { id: 'thermal_printer_int', label: 'Thermal Printer Integration', type: 'category' }
      ]
    },
    {
      id: 'master_data',
      label: 'Master Data Mock',
      type: 'module',
      children: [
        { id: 'waste_types', label: '5 Waste Paper Types', type: 'category' },
        { id: 'chem_count', label: '18 Chemicals', type: 'category' },
        { id: 'reserved_prods', label: 'Reserved Products (Ready)', type: 'category' },
        { id: 'exists_stock', label: 'Exists Stock (All Grades)', type: 'category' }
      ]
    },
    {
      id: 'module_integ',
      label: 'Module Integration',
      type: 'module',
      children: [
        { id: 'mod_rm_stock', label: 'Raw Material & Finished Stock', type: 'category' },
        { id: 'mod_pulp_prod', label: 'Pulp & Mill Machine Production', type: 'category' },
        { id: 'mod_rewinder', label: 'Rewinding & Reel Conversion', type: 'category' },
        {
          id: 'mod_boiler',
          label: 'Boiler & Steam',
          type: 'category',
          children: [
            { id: 'safety_water', label: 'Safety & Water Compliance', type: 'field' },
            { id: 'boiler_daily_log', label: 'Operator daily log sheet', type: 'field' }
          ]
        },
        { id: 'mod_etp_elec', label: 'ETP & Electricity Logs', type: 'category' },
        { id: 'mod_spareparts', label: 'Spareparts Management', type: 'category' },
        { id: 'mod_reports', label: 'Monthly/Yearly Reporting', type: 'category' },
        { id: 'mod_admin', label: 'Admin Panel & Audit', type: 'category' }
      ]
    },
    {
      id: 'roles_perms',
      label: 'Roles & Permissions',
      type: 'module',
      children: [
        { id: 'role_admin', label: 'Admin (Full Access)', type: 'category' },
        { id: 'role_mill_op', label: 'Mill Machinery Operator Permissions', type: 'category' },
        { id: 'role_boiler_op', label: 'Boiler Operator Accessibility', type: 'category' },
        { id: 'role_warehouse', label: 'Warehouse & Store Staff', type: 'category' },
        { id: 'role_mgmt', label: 'Management Viewers', type: 'category' }
      ]
    },
    {
      id: 'tech_specs',
      label: 'Technical Specifications',
      type: 'module',
      children: [
        { id: 'tech_framework', label: 'Framework: React 19 + TypeScript', type: 'category' },
        { id: 'tech_css', label: 'CSS: Tailwind v4 + PostCSS', type: 'category' },
        { id: 'tech_icons', label: 'Icons: Lucide React (Original)', type: 'category' },
        { id: 'tech_dark_mode', label: 'Dark Mode Design System', type: 'category' }
      ]
    },
    {
      id: 'impl_phases',
      label: 'Implementation Plan',
      type: 'module',
      children: [
        { id: 'phase_1', label: '1. Setup & Inward Stock', type: 'category' },
        { id: 'phase_2', label: '2. Roll Production & QC', type: 'category' },
        { id: 'phase_3', label: '3. Reel Output Roll Conversion', type: 'category' },
        { id: 'phase_4', label: '4. Reporting & Audit Logs', type: 'category' }
      ]
    }
  ]
};

export const SystemMindMapView: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Collapse state management (start with level 3 nested leaves collapsed to keep it readable)
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    initial.add('stage_1');
    initial.add('stage_2');
    initial.add('mod_boiler');
    return initial;
  });

  const [searchTerm, setSearchTerm] = useState('');
  
  // Zoom & Pan states
  const [zoom, setZoom] = useState(0.8);
  const [panX, setPanX] = useState(30);
  const [panY, setPanY] = useState(150);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Toggle node collapse/expand
  const toggleCollapse = (id: string) => {
    setCollapsedIds(prev => {
      const updated = new Set(prev);
      if (updated.has(id)) {
        updated.delete(id);
      } else {
        updated.add(id);
      }
      return updated;
    });
  };

  // Expand all nodes
  const expandAll = () => {
    setCollapsedIds(new Set());
  };

  // Collapse all except root & modules
  const collapseAll = () => {
    const list = new Set<string>();
    erpTreeData.children?.forEach(mod => {
      list.add(mod.id);
    });
    setCollapsedIds(list);
  };

  // Drag and Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'button' || (e.target as HTMLElement).closest('button')) {
      return;
    }
    setIsDragging(true);
    setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanX(e.clientX - dragStart.x);
    setPanY(e.clientY - dragStart.y);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = 0.05;
    let newZoom = zoom;
    if (e.deltaY < 0) {
      newZoom = Math.min(zoom + zoomFactor, 2);
    } else {
      newZoom = Math.max(zoom - zoomFactor, 0.4);
    }
    setZoom(newZoom);
  };

  // Reset view to center
  const resetView = () => {
    setZoom(0.85);
    setPanX(40);
    setPanY(150);
  };

  // Build node layouts recursively
  const getLayout = () => {
    const yOffset = { current: 30 };
    
    const layoutTree = (
      node: TreeNode,
      depth: number,
      parentId?: string
    ): { nodes: LayoutNode[]; connections: Connection[] } => {
      const cardWidth = 190;
      const x = depth * 260 + 60; // 260px horizontal level gap
      const id = node.id;
      const isCollapsed = collapsedIds.has(id);
      const hasChildren = !!node.children && node.children.length > 0;
      
      const nodes: LayoutNode[] = [];
      const connections: Connection[] = [];
      
      let activeChildren = node.children || [];
      
      if (isCollapsed || activeChildren.length === 0) {
        const y = yOffset.current;
        yOffset.current += 65; // 65px vertical leaf node spacing
        
        nodes.push({
          id,
          label: node.label,
          type: node.type,
          x,
          y,
          collapsed: isCollapsed,
          parentId,
          hasChildren
        });
        
        return { nodes, connections };
      } else {
        const childNodes: LayoutNode[] = [];
        const childConnections: Connection[] = [];
        const childrenYPositions: number[] = [];
        
        activeChildren.forEach(child => {
          const res = layoutTree(child, depth + 1, id);
          childNodes.push(...res.nodes);
          childConnections.push(...res.connections);
          
          const directChild = res.nodes.find(n => n.id === child.id);
          if (directChild) {
            childrenYPositions.push(directChild.y);
          }
        });
        
        const y = childrenYPositions.length > 0
          ? childrenYPositions.reduce((sum, v) => sum + v, 0) / childrenYPositions.length
          : yOffset.current;
          
        nodes.push({
          id,
          label: node.label,
          type: node.type,
          x,
          y,
          collapsed: isCollapsed,
          parentId,
          hasChildren
        });
        
        nodes.push(...childNodes);
        connections.push(...childConnections);
        
        activeChildren.forEach(child => {
          const childNode = childNodes.find(n => n.id === child.id);
          if (childNode) {
            connections.push({
              fromId: id,
              toId: child.id,
              from: { x: x + cardWidth, y: y + 18 },
              to: { x: childNode.x, y: childNode.y + 18 }
            });
          }
        });
        
        return { nodes, connections };
      }
    };

    return layoutTree(erpTreeData, 0);
  };

  const { nodes, connections } = getLayout();

  const isMatch = (label: string) => {
    if (!searchTerm) return false;
    return label.toLowerCase().includes(searchTerm.toLowerCase());
  };

  return (
    <div className="space-y-4 flex flex-col h-[calc(100vh-8.5rem)] select-none">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-light dark:border-slate-700 pb-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <QrCode className="h-5.5 w-5.5 text-primary" />
            Saheb Paper ERP — System Mind Map
          </h2>
          <p className="text-xs text-text-light-secondary dark:text-slate-400 mt-0.5">
            Interactive visual diagram of modules, parameters, categories, and field structures.
          </p>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search schemas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs rounded-md pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary w-44"
            />
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          </div>

          <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-md overflow-hidden bg-white dark:bg-slate-800">
            <button
              onClick={() => setZoom(z => Math.max(z - 0.1, 0.4))}
              title="Zoom Out"
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 border-r border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setZoom(z => Math.min(z + 0.1, 2))}
              title="Zoom In"
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 border-r border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={resetView}
              title="Recenter Map"
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
            >
              <Maximize className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            onClick={expandAll}
            className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded text-xs font-semibold"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded text-xs font-semibold"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Main Canvas Workspace */}
      <div 
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className={`flex-1 rounded-lg bg-[#14151b] border border-slate-200 dark:border-slate-800 relative overflow-hidden ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        {/* Help Overlay */}
        <div className="absolute left-3 bottom-3 z-10 bg-slate-900/90 text-slate-300 p-2.5 rounded-md text-[10px] space-y-1 max-w-xs border border-slate-800 shadow-md pointer-events-none">
          <div className="flex items-center gap-1 font-bold text-white uppercase text-[10px] mb-1">
            <HelpCircle className="h-3.5 w-3.5 text-primary" />
            Interactive Mind Map controls
          </div>
          <div>• <b>Drag / Move:</b> Click & hold the empty canvas to pan around.</div>
          <div>• <b>Zoom:</b> Use mouse scroll wheel to zoom in/out.</div>
          <div>• <b>Expand/Collapse:</b> Click the green/gray circle toggles on nodes.</div>
        </div>

        {/* SVG Drawing Canvas */}
        <svg
          width="100%"
          height="100%"
          className="absolute inset-0"
          style={{ pointerEvents: 'none' }}
        >
          <g transform={`translate(${panX}, ${panY}) scale(${zoom})`}>
            
            {/* 1. Curved Connections */}
            {connections.map((c, i) => {
              const dx = Math.abs(c.to.x - c.from.x);
              const xMid = c.from.x + dx * 0.45;
              const targetNode = nodes.find(n => n.id === c.toId);
              const highlighted = isMatch(targetNode?.label || '');
              
              return (
                <path
                  key={`conn-${i}`}
                  d={`M ${c.from.x} ${c.from.y} C ${xMid} ${c.from.y}, ${xMid} ${c.to.y}, ${c.to.x} ${c.to.y}`}
                  fill="none"
                  stroke={highlighted ? '#10b981' : '#475569'}
                  strokeWidth={highlighted ? '2.5' : '1.5'}
                  strokeDasharray={targetNode?.type === 'field' ? '4 3' : 'none'}
                  strokeOpacity="0.8"
                />
              );
            })}

            {/* 2. Interactive Mind Map Nodes */}
            {nodes.map(node => {
              const cardWidth = 190;
              const cardHeight = 36;
              const highlighted = isMatch(node.label);
              
              // Define node styles based on type
              let bg = '#1f2937';
              let border = '#4b5563';
              let text = '#f3f4f6';
              let dotColor = '#9ca3af';
              
              if (node.type === 'root') {
                bg = '#1a1f36';
                border = '#3f51b5';
                text = '#ffffff';
                dotColor = '#5c6bc0';
              } else if (node.type === 'module') {
                bg = '#1f2937';
                border = '#4b5563';
                text = '#f3f4f6';
                dotColor = '#9ca3af';
              } else if (node.type === 'category') {
                bg = '#162e2a';
                border = '#1f8269';
                text = '#a7f3d0';
                dotColor = '#10b981';
              } else if (node.type === 'field') {
                bg = '#11221f';
                border = '#124f41';
                text = '#d1fae5';
                dotColor = '#059669';
              }

              // Overwrite styling on search match highlight
              if (highlighted) {
                border = '#10b981';
                bg = '#064e3b';
                text = '#ffffff';
              }

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  style={{ pointerEvents: 'auto' }}
                >
                  {/* Outer Node Pill Box */}
                  <rect
                    width={cardWidth}
                    height={cardHeight}
                    rx="18"
                    fill={bg}
                    stroke={border}
                    strokeWidth={highlighted ? 2.5 : 1.5}
                    filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.4))"
                    className="transition-colors duration-150"
                  />

                  {/* Node Type Color Indicator Dot */}
                  <circle
                    cx="15"
                    cy={cardHeight / 2}
                    r="5"
                    fill={dotColor}
                  />

                  {/* Node Label Text */}
                  <text
                    x="28"
                    y={cardHeight / 2 + 4}
                    fill={text}
                    fontSize="11px"
                    fontFamily="'Inter', sans-serif"
                    fontWeight={node.type === 'root' || node.type === 'module' ? 'bold' : 'normal'}
                  >
                    {node.label.length > 22 ? `${node.label.substring(0, 20)}...` : node.label}
                  </text>

                  {/* Collapse Toggle Button (Chevrons) at right edge */}
                  {node.hasChildren && (
                    <g
                      transform={`translate(${cardWidth - 8}, ${cardHeight / 2})`}
                      onClick={() => toggleCollapse(node.id)}
                      className="cursor-pointer"
                    >
                      <title>{node.collapsed ? 'Expand' : 'Collapse'}</title>
                      <circle
                        cx="0"
                        cy="0"
                        r="8.5"
                        fill={node.collapsed ? '#059669' : '#1e293b'}
                        stroke={node.collapsed ? '#10b981' : border}
                        strokeWidth="1.2"
                      />
                      {node.collapsed ? (
                        <path
                          d="M -4 0 L 4 0 M 0 -4 L 0 4"
                          stroke="#ffffff"
                          strokeWidth="1.5"
                        />
                      ) : (
                        <path
                          d="M -3 0 L 3 0"
                          stroke="#a7f3d0"
                          strokeWidth="1.5"
                        />
                      )}
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

    </div>
  );
};

export default SystemMindMapView;

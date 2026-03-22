import { useMemo } from 'react'
import type { AtlasNode, AtlasData, LensId } from '../types/atlas'
import { ATLAS_THEME } from '../config/theme'

interface SidePanelProps {
  node: AtlasNode | null
  lens: LensId
  data: AtlasData
  onClose: () => void
}

const TYPE_LABELS: Record<string, string> = {
  core: 'Core Hub',
  hub: 'Japan Hub',
  anchor: 'Anchor',
  regional: 'Regional',
  micro: 'Micronation',
}

export function SidePanel({ node, lens, data, onClose }: SidePanelProps) {
  const nodePrograms = useMemo(
    () => (node ? data.programs.filter((p) => p.nodeId === node.id) : []),
    [node, data.programs],
  )

  const nodePartners = useMemo(
    () => (node ? data.partners.filter((p) => p.nodeId === node.id) : []),
    [node, data.partners],
  )

  const isOpen = node !== null

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        width: 380,
        zIndex: 20,
        background: 'rgba(15, 23, 42, 0.92)',
        backdropFilter: 'blur(20px)',
        borderLeft: `1px solid ${ATLAS_THEME.border}`,
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        overflowY: 'auto',
        padding: '80px 24px 24px',
      }}
    >
      {node && (
        <>
          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              background: 'none',
              border: 'none',
              color: ATLAS_THEME.text.muted,
              fontSize: 18,
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            ✕
          </button>

          {/* Node header */}
          <div style={{ marginBottom: 16 }}>
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: 22,
                fontWeight: 300,
                letterSpacing: '0.06em',
                color: ATLAS_THEME.text.primary,
                margin: '0 0 4px',
              }}
            >
              {node.name}
            </h2>
            {node.nameJa && (
              <p
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 12,
                  color: ATLAS_THEME.text.muted,
                  margin: '0 0 8px',
                }}
              >
                {node.nameJa}
              </p>
            )}
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                color: ATLAS_THEME.text.secondary,
                margin: 0,
              }}
            >
              {TYPE_LABELS[node.type] ?? node.type}
            </p>
          </div>

          {/* Segment tags */}
          {node.segments.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
              {node.segments.map((segId) => {
                const seg = data.segments[segId]
                return (
                  <span
                    key={segId}
                    style={{
                      padding: '3px 10px',
                      borderRadius: 12,
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 10,
                      background: seg.color + '15',
                      border: `1px solid ${seg.color}30`,
                      color: seg.color,
                    }}
                  >
                    {seg.icon} {seg.label}
                  </span>
                )
              })}
            </div>
          )}

          {/* Divider */}
          <div
            style={{
              height: 1,
              background: ATLAS_THEME.border,
              margin: '16px 0',
            }}
          />

          {/* Programs section */}
          {nodePrograms.length > 0 && (
            <div>
              <p
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.15em',
                  color: ATLAS_THEME.text.secondary,
                  marginBottom: 10,
                }}
              >
                Programs & Pipeline ({nodePrograms.length})
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {nodePrograms.map((prog) => (
                  <div
                    key={prog.id}
                    style={{
                      background: ATLAS_THEME.bg,
                      border: `1px solid ${ATLAS_THEME.border}`,
                      borderRadius: 8,
                      padding: '12px 14px',
                      transition: 'border-color 0.2s ease',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 6,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: 12,
                          fontWeight: 500,
                          color: ATLAS_THEME.text.primary,
                        }}
                      >
                        {prog.name}
                      </span>
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 9,
                          padding: '2px 8px',
                          borderRadius: 10,
                          textTransform: 'uppercase',
                          background:
                            ATLAS_THEME.status[prog.status] + '18',
                          color: ATLAS_THEME.status[prog.status],
                        }}
                      >
                        {prog.status}
                      </span>
                    </div>
                    <p
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 10,
                        color: ATLAS_THEME.text.muted,
                        margin: '0 0 6px',
                      }}
                    >
                      {prog.date} · {data.segments[prog.segment].icon}{' '}
                      {data.segments[prog.segment].label}
                    </p>
                    <p
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 11,
                        color: ATLAS_THEME.text.secondary,
                        lineHeight: 1.5,
                        margin: 0,
                      }}
                    >
                      {prog.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Partners section */}
          {nodePartners.length > 0 && (
            <div style={{ marginTop: nodePrograms.length > 0 ? 20 : 0 }}>
              <p
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.15em',
                  color: ATLAS_THEME.text.secondary,
                  marginBottom: 10,
                }}
              >
                Partner Entities ({nodePartners.length})
              </p>
              <div>
                {nodePartners.map((partner) => (
                  <div
                    key={partner.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 0',
                      borderBottom: `1px solid ${ATLAS_THEME.border}`,
                    }}
                  >
                    <div>
                      <p
                        style={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: 12,
                          color: ATLAS_THEME.text.primary,
                          margin: 0,
                        }}
                      >
                        {partner.name}
                      </p>
                      {partner.nameJa && (
                        <p
                          style={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: 10,
                            color: ATLAS_THEME.text.muted,
                            margin: '2px 0 0',
                          }}
                        >
                          {partner.nameJa}
                        </p>
                      )}
                    </div>
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: ATLAS_THEME.status[partner.status],
                        flexShrink: 0,
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {nodePrograms.length === 0 && nodePartners.length === 0 && (
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 12,
                color: ATLAS_THEME.text.muted,
                textAlign: 'center',
                marginTop: 40,
              }}
            >
              No active programs or partners at this node.
            </p>
          )}
        </>
      )}
    </div>
  )
}

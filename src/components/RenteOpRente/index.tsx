import { RenteOpRenteTool } from './RenteOpRenteTool'
import { MAANDELIJKS, EENMALIG } from './varianten'

/** /tools/maandelijks-beleggen */
export function MaandelijkseInlegTool() {
  return <RenteOpRenteTool variant={MAANDELIJKS} />
}

/** /tools/rente-op-rente */
export function EenmaligeInlegTool() {
  return <RenteOpRenteTool variant={EENMALIG} />
}

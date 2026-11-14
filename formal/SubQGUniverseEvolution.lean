import Mathlib.Data.Finset.Card
import Mathlib.Data.List.Basic
import Mathlib.Tactic.NormNum

/-!
# Formal invariants of the additive SubQG universe evolution layer

This file does not postulate stars, planets, nebulae, or galaxies as fundamental
objects. It proves structural invariants of causal actualization and of the
strict separation between SubQG dynamics and post-hoc interpretation.
-/

namespace SubQGUniverseEvolution

/-- A finite relational snapshot. `dynamicsFingerprint` represents all underlying
SubQG field and metric data abstractly; classifiers are not allowed to modify it. -/
structure RelationalState where
  nodes : Finset ℕ
  edges : Finset ℕ
  simplices : Finset ℕ
  relationalClock : ℕ
  epoch : ℕ
  dynamicsFingerprint : ℕ
  deriving DecidableEq

/-- Before causal actualization there is one relational event but no spatial edge,
simplex, or relational clock advance. -/
def initialState (seedNode dynamicsFingerprint : ℕ) : RelationalState where
  nodes := {seedNode}
  edges := ∅
  simplices := ∅
  relationalClock := 0
  epoch := 0
  dynamicsFingerprint := dynamicsFingerprint

theorem initial_has_one_event (seed fingerprint : ℕ) :
    (initialState seed fingerprint).nodes.card = 1 := by
  simp [initialState]

theorem initial_has_no_spatial_edges (seed fingerprint : ℕ) :
    (initialState seed fingerprint).edges = ∅ := by
  rfl

theorem initial_has_no_simplices (seed fingerprint : ℕ) :
    (initialState seed fingerprint).simplices = ∅ := by
  rfl

theorem initial_clock_is_zero (seed fingerprint : ℕ) :
    (initialState seed fingerprint).relationalClock = 0 := by
  rfl

/-- A valid evolution step may only add actualized relations and may never move
the relational clock or epoch backwards. -/
structure CausalExtension (before after : RelationalState) : Prop where
  nodes_mono : before.nodes ⊆ after.nodes
  edges_mono : before.edges ⊆ after.edges
  simplices_mono : before.simplices ⊆ after.simplices
  clock_mono : before.relationalClock ≤ after.relationalClock
  epoch_mono : before.epoch ≤ after.epoch

theorem causal_nodes_monotone {before after : RelationalState}
    (h : CausalExtension before after) : before.nodes ⊆ after.nodes :=
  h.nodes_mono

theorem causal_edges_monotone {before after : RelationalState}
    (h : CausalExtension before after) : before.edges ⊆ after.edges :=
  h.edges_mono

theorem causal_simplices_monotone {before after : RelationalState}
    (h : CausalExtension before after) : before.simplices ⊆ after.simplices :=
  h.simplices_mono

theorem relational_clock_monotone {before after : RelationalState}
    (h : CausalExtension before after) :
    before.relationalClock ≤ after.relationalClock :=
  h.clock_mono

theorem causal_extension_transitive {a b c : RelationalState}
    (hab : CausalExtension a b) (hbc : CausalExtension b c) :
    CausalExtension a c := by
  exact {
    nodes_mono := hab.nodes_mono.trans hbc.nodes_mono
    edges_mono := hab.edges_mono.trans hbc.edges_mono
    simplices_mono := hab.simplices_mono.trans hbc.simplices_mono
    clock_mono := hab.clock_mono.trans hbc.clock_mono
    epoch_mono := hab.epoch_mono.trans hbc.epoch_mono
  }

/-- Archiving a macroscopic signature does not delete the SubQG node on which
it was measured. Actualized nodes remain actualized under every causal
extension, independently of later observational labels. -/
theorem archived_signature_preserves_actualized_node
    {before after : RelationalState} (peakNode : ℕ)
    (hExtension : CausalExtension before after)
    (hActualized : peakNode ∈ before.nodes) :
    peakNode ∈ after.nodes := by
  exact hExtension.nodes_mono hActualized

/-- A serialized network-path diagnostic carries its endpoints as checked
data. It is evidence about the relational graph, not about the visual 3-D
embedding. -/
structure NetworkPathDiagnostic where
  source : ℕ
  target : ℕ
  nodes : List ℕ
  startsAtSource : nodes.head? = some source
  endsAtTarget : nodes.getLast? = some target

theorem network_path_diagnostic_connects_recorded_endpoints
    (diagnostic : NetworkPathDiagnostic) :
    ∃ path : List ℕ,
      path.head? = some diagnostic.source ∧
      path.getLast? = some diagnostic.target := by
  exact ⟨diagnostic.nodes, diagnostic.startsAtSource, diagnostic.endsAtTarget⟩

/-- Constructive append-only actualization. New edge and simplex counts advance
the internal relational clock. -/
def actualize (state : RelationalState)
    (newNodes newEdges newSimplices : Finset ℕ)
    (epochAdvance nextDynamicsFingerprint : ℕ) : RelationalState where
  nodes := state.nodes ∪ newNodes
  edges := state.edges ∪ newEdges
  simplices := state.simplices ∪ newSimplices
  relationalClock := state.relationalClock + newEdges.card + newSimplices.card
  epoch := state.epoch + epochAdvance
  dynamicsFingerprint := nextDynamicsFingerprint

theorem actualize_is_causal_extension (state : RelationalState)
    (newNodes newEdges newSimplices : Finset ℕ)
    (epochAdvance nextDynamicsFingerprint : ℕ) :
    CausalExtension state
      (actualize state newNodes newEdges newSimplices epochAdvance nextDynamicsFingerprint) := by
  constructor
  · exact Finset.subset_union_left
  · exact Finset.subset_union_left
  · exact Finset.subset_union_left
  · simp [actualize, Nat.add_assoc]
  · simp [actualize]

theorem actualization_clock_increment (state : RelationalState)
    (newNodes newEdges newSimplices : Finset ℕ)
    (epochAdvance nextDynamicsFingerprint : ℕ) :
    (actualize state newNodes newEdges newSimplices epochAdvance nextDynamicsFingerprint).relationalClock =
      state.relationalClock + newEdges.card + newSimplices.card := by
  rfl

theorem nonempty_new_relation_advances_clock (state : RelationalState)
    (newNodes newEdges newSimplices : Finset ℕ)
    (epochAdvance nextDynamicsFingerprint : ℕ)
    (h : newEdges.Nonempty ∨ newSimplices.Nonempty) :
    state.relationalClock <
      (actualize state newNodes newEdges newSimplices epochAdvance nextDynamicsFingerprint).relationalClock := by
  have hSum : 0 < newEdges.card + newSimplices.card := by
    rcases h with hEdges | hSimplices
    · exact Nat.add_pos_left (Finset.card_pos.mpr hEdges) _
    · exact Nat.add_pos_right _ (Finset.card_pos.mpr hSimplices)
  simp only [actualize]
  have hAdvance : state.relationalClock <
      state.relationalClock + (newEdges.card + newSimplices.card) :=
    Nat.lt_add_of_pos_right hSum
  simpa [Nat.add_assoc] using
    hAdvance

/-- Human-readable years are an explicit calibration of internal epochs and do
not enter the state transition law. -/
def calibratedAge (yearsPerEpoch epoch : ℕ) : ℕ := yearsPerEpoch * epoch

theorem calibrated_age_monotone (yearsPerEpoch : ℕ) {earlier later : ℕ}
    (h : earlier ≤ later) :
    calibratedAge yearsPerEpoch earlier ≤ calibratedAge yearsPerEpoch later := by
  exact Nat.mul_le_mul_left yearsPerEpoch h

theorem two_billion_year_display_calibration :
    calibratedAge 1000000 2000 = 2000000000 := by
  norm_num [calibratedAge]

/-- Interpretations are observational labels, never fundamental dynamical kinds. -/
inductive Interpretation where
  | unknown
  | radiantCoreCandidate
  | orbitalBodyCandidate
  | diffuseCloudCandidate
  | galacticComplexCandidate
  | phaseReleaseCandidate
  deriving DecidableEq, Repr

structure Candidate where
  interpretation : Interpretation
  scorePermille : ℕ
  deriving DecidableEq

structure Analysis where
  candidates : List Candidate
  resolved : Option Interpretation
  deriving DecidableEq

def unknownAnalysis : Analysis where
  candidates := []
  resolved := none

theorem unknown_is_a_valid_unresolved_result : unknownAnalysis.resolved = none := by
  rfl

/-- An observation packages raw dynamics with a replaceable, post-hoc analysis. -/
structure Observation where
  physicalState : RelationalState
  rawEvidenceFingerprint : ℕ
  analysis : Analysis
  deriving DecidableEq

def reanalyze (observation : Observation) (newAnalysis : Analysis) : Observation where
  physicalState := observation.physicalState
  rawEvidenceFingerprint := observation.rawEvidenceFingerprint
  analysis := newAnalysis

@[simp] theorem reanalysis_preserves_physical_state
    (observation : Observation) (newAnalysis : Analysis) :
    (reanalyze observation newAnalysis).physicalState = observation.physicalState := by
  rfl

@[simp] theorem reanalysis_preserves_raw_evidence
    (observation : Observation) (newAnalysis : Analysis) :
    (reanalyze observation newAnalysis).rawEvidenceFingerprint =
      observation.rawEvidenceFingerprint := by
  rfl

theorem competing_interpretations_do_not_change_dynamics
    (observation : Observation) (galaxy nebula unknown : Analysis) :
    (reanalyze observation galaxy).physicalState =
      (reanalyze observation nebula).physicalState ∧
    (reanalyze observation nebula).physicalState =
      (reanalyze observation unknown).physicalState := by
  constructor <;> rfl

/-- Appending a newly discovered observation preserves every earlier archive entry. -/
def archiveDiscovery (archive : List Observation) (newObservation : Observation) :
    List Observation := archive ++ [newObservation]

theorem prior_discoveries_remain_in_archive
    (archive : List Observation) (newObservation prior : Observation)
    (hPrior : prior ∈ archive) :
    prior ∈ archiveDiscovery archive newObservation := by
  exact List.mem_append_left [newObservation] hPrior

theorem new_discovery_is_archived
    (archive : List Observation) (newObservation : Observation) :
    newObservation ∈ archiveDiscovery archive newObservation := by
  simp [archiveDiscovery]

#print axioms initial_has_no_spatial_edges
#print axioms causal_extension_transitive
#print axioms archived_signature_preserves_actualized_node
#print axioms network_path_diagnostic_connects_recorded_endpoints
#print axioms actualize_is_causal_extension
#print axioms nonempty_new_relation_advances_clock
#print axioms two_billion_year_display_calibration
#print axioms reanalysis_preserves_physical_state
#print axioms competing_interpretations_do_not_change_dynamics
#print axioms prior_discoveries_remain_in_archive

end SubQGUniverseEvolution

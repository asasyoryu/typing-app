{
  description = "返信打 development environment";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

  outputs =
    { nixpkgs, ... }:
    let
      systems = [
        "x86_64-linux"
        "aarch64-linux"
      ];
      forAllSystems = nixpkgs.lib.genAttrs systems;
    in
    {
      devShells = forAllSystems (
        system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
        in
        {
          default = pkgs.mkShell {
            packages = [
              pkgs.just
              pkgs.git
              pkgs.gh
              pkgs.curl
            ];
            shellHook = "export PATH=\"$HOME/.local/share/vite-plus/bin:$HOME/.local/bin:$PATH\"";
          };
        }
      );
    };
}
